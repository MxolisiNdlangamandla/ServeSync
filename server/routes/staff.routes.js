const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/staff  (scoped to store)
router.get('/', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, invite_token, is_online, last_seen_at FROM profiles WHERE store_id = ? ORDER BY role, full_name',
      [storeId]
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
    const { email, role, full_name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });

    const [existing] = await pool.query('SELECT id FROM profiles WHERE email = ?', [email]);
    if (existing.length) {
      // Update role + store if already exists
      await pool.query('UPDATE profiles SET role = ?, store_id = ?, full_name = COALESCE(?, full_name), invite_token = COALESCE(invite_token, UUID()), is_online = FALSE WHERE email = ?', [role || 'user', storeId, full_name || null, email]);
      return res.json({ success: true, message: 'Role updated' });
    }

    const id = uuidv4();
    const inviteToken = uuidv4();
    // Temporary password — staff accepts invite to set real password
    const tempHash = await bcrypt.hash(uuidv4(), 10);
    await pool.query(
      'INSERT INTO profiles (id, email, password_hash, role, store_id, invite_token, full_name, is_online) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)',
      [id, email, tempHash, role || 'user', storeId, inviteToken, full_name || null]
    );
    res.status(201).json({ success: true, message: 'Staff member invited', inviteToken });
  } catch (err) {
    console.error('Invite staff error:', err);
    res.status(500).json({ error: 'Failed to invite staff' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    await pool.query('DELETE FROM profiles WHERE id = ? AND store_id = ?', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

module.exports = router;
