const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

async function getSubscriptionTier(userId) {
  const [rows] = await pool.query('SELECT subscription_tier FROM profiles WHERE id = ?', [userId]);
  return rows.length ? rows[0].subscription_tier : null;
}

async function getAccessibleStoreIds(user) {
  if (!user?.store_id) {
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

async function resolveUserFromToken(header) {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const [profiles] = await pool.query(
      'SELECT id, role, subscription_tier, store_id FROM profiles WHERE id = ? LIMIT 1',
      [decoded.id]
    );
    return profiles[0] || null;
  } catch {
    return null;
  }
}

// GET /api/menu  (public — scoped by store_id query param or JWT)
router.get('/', async (req, res) => {
  try {
    const requestedStoreId = req.query.store_id;
    let storeId = requestedStoreId;
    const actor = await resolveUserFromToken(req.headers.authorization);

    // If JWT present, use that store
    if (!storeId) {
      if (actor?.store_id) {
        storeId = actor.store_id;
      }
    }

    // Also resolve store_id from an order if order_id is provided (for customer menu)
    if (!storeId && req.query.order_id) {
      const [orders] = await pool.query('SELECT store_id FROM orders WHERE id = ?', [req.query.order_id]);
      if (orders.length) storeId = orders[0].store_id;
    }

    if (!storeId) return res.status(400).json({ error: 'store_id is required' });

    if (storeId === 'all') {
      if (!actor || actor.role !== 'admin' || actor.subscription_tier !== 'tier4') {
        return res.status(403).json({ error: 'Only enterprise admins can view all site menus' });
      }

      const accessibleStoreIds = await getAccessibleStoreIds(actor);
      if (!accessibleStoreIds.length) {
        return res.status(403).json({ error: 'No store associated with this account' });
      }

      const placeholders = accessibleStoreIds.map(() => '?').join(', ');
      const [rows] = await pool.query(
        `SELECT mi.*, s.name AS assigned_store_name
         FROM menu_items mi
         LEFT JOIN stores s ON s.id = mi.store_id
         WHERE mi.store_id IN (${placeholders})
         ORDER BY s.name ASC, mi.category ASC, mi.name ASC`,
        accessibleStoreIds
      );
      return res.json(rows);
    }

    if (actor) {
      const accessibleStoreIds = await getAccessibleStoreIds(actor);
      if (!accessibleStoreIds.includes(storeId)) {
        return res.status(403).json({ error: 'You do not have access to that site' });
      }
    }

    const [rows] = await pool.query(
      `SELECT mi.*, s.name AS assigned_store_name
       FROM menu_items mi
       LEFT JOIN stores s ON s.id = mi.store_id
       WHERE mi.store_id = ?
       ORDER BY mi.category ASC, mi.name ASC`,
      [storeId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST /api/menu
router.post('/', auth, async (req, res) => {
  try {
    const { name, price, category, description, storeId: requestedStoreId } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ error: 'name, price, category are required' });
    }
    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    const storeId = requestedStoreId || req.user.store_id;
    if (!storeId || !accessibleStoreIds.includes(storeId)) {
      return res.status(403).json({ error: 'No store associated with this account' });
    }
    if (!storeId) return res.status(403).json({ error: 'No store associated with this account' });
    const tier = await getSubscriptionTier(req.user.id);
    if (tier === 'tier1') {
      return res.status(403).json({ error: 'Menu management is available on Essentials, Professional and Enterprise plans' });
    }

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
    const tier = await getSubscriptionTier(req.user.id);
    if (tier === 'tier1') {
      return res.status(403).json({ error: 'Menu management is available on Essentials, Professional and Enterprise plans' });
    }

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) {
      return res.status(403).json({ error: 'No store associated with this account' });
    }

    const [items] = await pool.query('SELECT id, store_id FROM menu_items WHERE id = ? LIMIT 1', [req.params.id]);
    if (!items.length) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    if (!accessibleStoreIds.includes(items[0].store_id)) {
      return res.status(403).json({ error: 'You do not have access to that menu item' });
    }

    if (req.body.storeId !== undefined && !accessibleStoreIds.includes(req.body.storeId)) {
      return res.status(403).json({ error: 'You do not have access to that site' });
    }

    const fields = [];
    const values = [];
    const allowed = ['name', 'price', 'category', 'description', 'available'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (req.body.storeId !== undefined) {
      fields.push('store_id = ?');
      values.push(req.body.storeId);
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(req.params.id);
    await pool.query(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('Update menu item error:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const tier = await getSubscriptionTier(req.user.id);
    if (tier === 'tier1') {
      return res.status(403).json({ error: 'Menu management is available on Essentials, Professional and Enterprise plans' });
    }

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) {
      return res.status(403).json({ error: 'No store associated with this account' });
    }

    const [items] = await pool.query('SELECT store_id FROM menu_items WHERE id = ? LIMIT 1', [req.params.id]);
    if (!items.length) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    if (!accessibleStoreIds.includes(items[0].store_id)) {
      return res.status(403).json({ error: 'You do not have access to that menu item' });
    }

    await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete menu item error:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
