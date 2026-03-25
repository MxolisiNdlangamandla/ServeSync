const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

const ROLE_PRIORITY = {
  user: 1,
  supervisor: 2,
  manager: 3,
  admin: 4,
};

async function getAccessibleStoreIds(user) {
  if (!user.store_id) {
    return [];
  }

  if (user.role === 'admin' && user.subscription_tier === 'tier4') {
    const [rows] = await pool.query(
      'SELECT id FROM stores WHERE owner_profile_id = ? ORDER BY created_at ASC',
      [user.id]
    );
    const ids = rows.map((row) => row.id);
    if (user.store_id && !ids.includes(user.store_id)) {
      ids.unshift(user.store_id);
    }
    return ids.length ? ids : [user.store_id];
  }

  return [user.store_id];
}

function allowedManagedRoles(actorRole) {
  if (actorRole === 'admin' || actorRole === 'manager') {
    return ['manager', 'supervisor', 'user'];
  }

  if (actorRole === 'supervisor') {
    return ['supervisor', 'user'];
  }

  return [];
}

function canManageRole(actorRole, targetRole) {
  return allowedManagedRoles(actorRole).includes(targetRole);
}

async function getProfileById(profileId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.email, p.full_name, p.role, p.store_id, p.created_at, s.owner_profile_id
     FROM profiles p
     LEFT JOIN stores s ON s.id = p.store_id
     WHERE p.id = ?
     LIMIT 1`,
    [profileId]
  );
  return rows[0] || null;
}

// GET /api/staff  (scoped to store)
router.get('/', auth, async (req, res) => {
  try {
    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const requestedStoreId = req.query.storeId;
    let scopedStoreIds = accessibleStoreIds;
    if (requestedStoreId && requestedStoreId !== 'all') {
      if (!accessibleStoreIds.includes(requestedStoreId)) {
        return res.status(403).json({ error: 'You do not have access to that site' });
      }
      scopedStoreIds = [requestedStoreId];
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.full_name, p.email, p.role, p.invite_token, p.is_online, p.last_seen_at, p.store_id, s.name AS assigned_store_name
       FROM profiles p
       LEFT JOIN stores s ON s.id = p.store_id
       WHERE p.store_id IN (${scopedStoreIds.map(() => '?').join(', ')})
       ORDER BY p.role, p.full_name`,
      scopedStoreIds
    );
    res.json(rows);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/staff/invite
router.post('/invite', auth, async (req, res) => {
  try {
    const { email, role, full_name, storeId: requestedStoreId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to invite staff' });
    }

    const nextRole = role || 'user';
    if (!canManageRole(req.user.role, nextRole)) {
      return res.status(403).json({ error: 'You do not have permission to assign that role' });
    }

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const storeId = requestedStoreId || req.user.store_id;
    if (!storeId || !accessibleStoreIds.includes(storeId)) {
      return res.status(403).json({ error: 'You do not have access to that site' });
    }

    const [existing] = await pool.query('SELECT id FROM profiles WHERE email = ?', [email]);
    if (existing.length) {
      const existingProfile = await getProfileById(existing[0].id);
      if (!existingProfile) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      if (!accessibleStoreIds.includes(existingProfile.store_id) || !canManageRole(req.user.role, existingProfile.role)) {
        return res.status(403).json({ error: 'You do not have permission to update that staff member' });
      }

      // Update role + store if already exists
      await pool.query('UPDATE profiles SET role = ?, store_id = ?, full_name = COALESCE(?, full_name), invite_token = COALESCE(invite_token, UUID()), is_online = FALSE WHERE email = ?', [nextRole, storeId, full_name || null, email]);
      return res.json({ success: true, message: 'Role updated' });
    }

    const id = uuidv4();
    const inviteToken = uuidv4();
    // Temporary password — staff accepts invite to set real password
    const tempHash = await bcrypt.hash(uuidv4(), 10);
    await pool.query(
      'INSERT INTO profiles (id, email, password_hash, role, store_id, invite_token, full_name, is_online) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)',
      [id, email, tempHash, nextRole, storeId, inviteToken, full_name || null]
    );
    res.status(201).json({ success: true, message: 'Staff member invited', inviteToken });
  } catch (err) {
    console.error('Invite staff error:', err);
    res.status(500).json({ error: 'Failed to invite staff' });
  }
});

// PATCH /api/staff/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'manager', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to edit staff' });
    }

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const targetProfile = await getProfileById(req.params.id);
    if (!targetProfile) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    if (!accessibleStoreIds.includes(targetProfile.store_id)) {
      return res.status(403).json({ error: 'You do not have access to that staff member' });
    }

    if (req.user.id !== targetProfile.id && !canManageRole(req.user.role, targetProfile.role)) {
      return res.status(403).json({ error: 'You do not have permission to edit that staff member' });
    }

    const nextRole = req.body.role;
    if (nextRole !== undefined && !canManageRole(req.user.role, nextRole)) {
      return res.status(403).json({ error: 'You do not have permission to assign that role' });
    }

    const nextStoreId = req.body.storeId;
    if (nextStoreId !== undefined && !accessibleStoreIds.includes(nextStoreId)) {
      return res.status(403).json({ error: 'You do not have access to that site' });
    }

    const fields = [];
    const values = [];
    if (req.body.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(req.body.full_name || null);
    }
    if (nextRole !== undefined) {
      fields.push('role = ?');
      values.push(nextRole);
    }
    if (nextStoreId !== undefined) {
      fields.push('store_id = ?');
      values.push(nextStoreId);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to remove staff' });
    }

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const targetProfile = await getProfileById(req.params.id);
    if (!targetProfile) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    if (targetProfile.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove your own account' });
    }
    if (targetProfile.role === 'admin' || targetProfile.owner_profile_id === targetProfile.id) {
      return res.status(403).json({ error: 'The original admin account cannot be removed' });
    }
    if (!accessibleStoreIds.includes(targetProfile.store_id) || !canManageRole(req.user.role, targetProfile.role)) {
      return res.status(403).json({ error: 'You do not have permission to remove that staff member' });
    }

    await pool.query(
      `DELETE FROM profiles WHERE id = ? AND store_id IN (${accessibleStoreIds.map(() => '?').join(', ')})`,
      [req.params.id, ...accessibleStoreIds]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

module.exports = router;
