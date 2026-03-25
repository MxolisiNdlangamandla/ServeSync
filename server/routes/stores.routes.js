const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();
const ENTERPRISE_STORE_RATE = 450;

async function getProfile(userId) {
  const [rows] = await pool.query(
    'SELECT id, role, store_id, store_name, subscription_tier FROM profiles WHERE id = ?',
    [userId]
  );
  return rows[0] || null;
}

function serializeStore(store, primaryStoreId) {
  return {
    ...store,
    is_primary: store.id === primaryStoreId,
  };
}

router.get('/', auth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    if (!profile?.store_id) {
      return res.status(403).json({ error: 'No store associated with this account' });
    }

    let stores = [];
    if (profile.role === 'admin' && profile.subscription_tier === 'tier4') {
      const [rows] = await pool.query(
        'SELECT id, owner_profile_id, name, address_line1, city, contact_phone, status, created_at, updated_at FROM stores WHERE owner_profile_id = ? ORDER BY created_at ASC',
        [profile.id]
      );
      stores = rows.map((store) => serializeStore(store, profile.store_id));
    } else {
      const [rows] = await pool.query(
        'SELECT id, owner_profile_id, name, address_line1, city, contact_phone, status, created_at, updated_at FROM stores WHERE id = ? LIMIT 1',
        [profile.store_id]
      );
      if (rows.length) {
        stores = rows.map((store) => serializeStore(store, profile.store_id));
      } else {
        stores = [{
          id: profile.store_id,
          owner_profile_id: profile.id,
          name: profile.store_name || 'Primary Store',
          address_line1: null,
          city: null,
          contact_phone: null,
          status: 'active',
          created_at: null,
          updated_at: null,
          is_primary: true,
        }];
      }
    }

    const activeStoreCount = stores.filter((store) => store.status === 'active').length;
    res.json({
      stores,
      billing: {
        activeStoreCount,
        monthlyRate: ENTERPRISE_STORE_RATE,
        projectedMonthlyTotal: activeStoreCount * ENTERPRISE_STORE_RATE,
      },
    });
  } catch (err) {
    console.error('Get stores error:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    if (!profile || profile.role !== 'admin' || profile.subscription_tier !== 'tier4') {
      return res.status(403).json({ error: 'Only enterprise admins can add stores' });
    }

    const { name, address_line1, city, contact_phone, status } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO stores (id, owner_profile_id, name, address_line1, city, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, profile.id, name.trim(), address_line1?.trim() || null, city?.trim() || null, contact_phone?.trim() || null, status === 'inactive' ? 'inactive' : 'active']
    );

    const [rows] = await pool.query(
      'SELECT id, owner_profile_id, name, address_line1, city, contact_phone, status, created_at, updated_at FROM stores WHERE id = ?',
      [id]
    );
    res.status(201).json(serializeStore(rows[0], profile.store_id));
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    if (!profile || profile.role !== 'admin' || profile.subscription_tier !== 'tier4') {
      return res.status(403).json({ error: 'Only enterprise admins can update stores' });
    }

    const allowedFields = ['name', 'address_line1', 'city', 'contact_phone', 'status'];
    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        const value = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
        if (key === 'status' && !['active', 'inactive'].includes(value)) {
          return res.status(400).json({ error: 'Invalid store status' });
        }
        fields.push(`${key} = ?`);
        values.push(value || null);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(req.params.id, profile.id);
    const [result] = await pool.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = ? AND owner_profile_id = ?`,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Store not found' });
    }

    if (req.params.id === profile.store_id && req.body.name !== undefined) {
      await pool.query('UPDATE profiles SET store_name = ? WHERE id = ?', [req.body.name.trim() || 'Primary Store', profile.id]);
    }

    const [rows] = await pool.query(
      'SELECT id, owner_profile_id, name, address_line1, city, contact_phone, status, created_at, updated_at FROM stores WHERE id = ?',
      [req.params.id]
    );
    res.json(serializeStore(rows[0], profile.store_id));
  } catch (err) {
    console.error('Update store error:', err);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

module.exports = router;