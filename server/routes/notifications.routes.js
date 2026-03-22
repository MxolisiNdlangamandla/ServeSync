const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/notifications  (scoped to store)
router.get('/', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });
    const [rows] = await pool.query('SELECT * FROM notifications WHERE store_id = ? ORDER BY created_at DESC LIMIT 100', [storeId]);
    res.json(rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications
router.post('/', auth, async (req, res) => {
  try {
    const { order_id, table_number, type, message } = req.body;
    if (!type || !message) {
      return res.status(400).json({ error: 'type and message are required' });
    }
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO notifications (id, store_id, order_id, table_number, type, message) VALUES (?, ?, ?, ?, ?, ?)',
      [id, storeId, order_id || null, table_number || null, type, message]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    await pool.query('UPDATE notifications SET `read` = TRUE WHERE `read` = FALSE AND store_id = ?', [storeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

module.exports = router;
