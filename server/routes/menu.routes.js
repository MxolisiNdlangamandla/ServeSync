const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/menu  (public — scoped by store_id query param or JWT)
router.get('/', async (req, res) => {
  try {
    let storeId = req.query.store_id;

    // If JWT present, use that store
    if (!storeId) {
      const header = req.headers.authorization;
      if (header && header.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
          storeId = decoded.store_id;
          if (!storeId) {
            const [profiles] = await pool.query('SELECT store_id FROM profiles WHERE id = ?', [decoded.id]);
            if (profiles.length) storeId = profiles[0].store_id;
          }
        } catch { /* ignore */ }
      }
    }

    // Also resolve store_id from an order if order_id is provided (for customer menu)
    if (!storeId && req.query.order_id) {
      const [orders] = await pool.query('SELECT store_id FROM orders WHERE id = ?', [req.query.order_id]);
      if (orders.length) storeId = orders[0].store_id;
    }

    if (!storeId) return res.status(400).json({ error: 'store_id is required' });

    const [rows] = await pool.query('SELECT * FROM menu_items WHERE store_id = ? ORDER BY category, name', [storeId]);
    res.json(rows);
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST /api/menu
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ error: 'name, price, category are required' });
    }
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated with this account' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO menu_items (id, store_id, name, price, category, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, storeId, name, price, category, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create menu item error:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PATCH /api/menu/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const allowed = ['name', 'price', 'category', 'description', 'available'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields' });
    const storeId = req.user.store_id;
    values.push(req.params.id, storeId);
    await pool.query(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ? AND store_id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    await pool.query('DELETE FROM menu_items WHERE id = ? AND store_id = ?', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
