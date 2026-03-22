const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/categories
router.get('/', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });

    const [rows] = await pool.query('SELECT * FROM categories WHERE store_id = ? ORDER BY name', [storeId]);
    res.json(rows);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated' });

    const id = uuidv4();
    await pool.query('INSERT INTO categories (id, store_id, name) VALUES (?, ?, ?)', [id, storeId, name.trim()]);
    res.status(201).json({ id, store_id: storeId, name: name.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    await pool.query('DELETE FROM categories WHERE id = ? AND store_id = ?', [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
