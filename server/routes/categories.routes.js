const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

function parseAssignedStoreIds(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function serializeCategory(row) {
  return {
    ...row,
    assigned_store_ids: parseAssignedStoreIds(row.assigned_store_ids),
  };
}

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

async function getStoreOwnerId(storeId) {
  const [rows] = await pool.query('SELECT owner_profile_id, name FROM stores WHERE id = ? LIMIT 1', [storeId]);
  return rows[0] || null;
}

// GET /api/categories
router.get('/', auth, async (req, res) => {
  try {
    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const requestedStoreId = req.query.storeId;
    const defaultStoreId = req.user.store_id;

    if (requestedStoreId === 'all' && req.user.role === 'admin' && req.user.subscription_tier === 'tier4') {
      const [rows] = await pool.query(
        `SELECT c.id, c.store_id, c.owner_profile_id, c.name, c.is_global, c.assigned_store_ids, s.name AS store_name
         FROM categories c
         LEFT JOIN stores s ON s.id = c.store_id
         WHERE c.owner_profile_id = ?
         ORDER BY c.is_global DESC, c.name ASC`,
        [req.user.id]
      );
      return res.json(rows.map(serializeCategory));
    }

    const selectedStoreId = requestedStoreId && requestedStoreId !== 'all' ? requestedStoreId : defaultStoreId;
    if (!selectedStoreId || !accessibleStoreIds.includes(selectedStoreId)) {
      return res.status(403).json({ error: 'You do not have access to that site' });
    }

    const storeOwner = await getStoreOwnerId(selectedStoreId);
    if (!storeOwner) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const [rows] = await pool.query(
      `SELECT c.id, c.store_id, c.owner_profile_id, c.name, c.is_global, c.assigned_store_ids, s.name AS store_name
       FROM categories c
       LEFT JOIN stores s ON s.id = c.store_id
       WHERE (
         c.is_global = TRUE AND c.owner_profile_id = ?
       ) OR (
         c.store_id = ?
       ) OR (
         JSON_CONTAINS(COALESCE(c.assigned_store_ids, JSON_ARRAY()), JSON_ARRAY(?))
       )
       ORDER BY c.is_global DESC, c.name ASC`,
      [storeOwner.owner_profile_id, selectedStoreId, selectedStoreId]
    );
    res.json(rows.map(serializeCategory));
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
router.post('/', auth, async (req, res) => {
  try {
    const { name, isGlobal, storeId: requestedStoreId, assignedStoreIds } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    if (isGlobal && !(req.user.role === 'admin' && req.user.subscription_tier === 'tier4')) {
      return res.status(403).json({ error: 'Only enterprise admins can create global categories' });
    }

    const normalizedAssignedStoreIds = Boolean(isGlobal)
      ? []
      : [...new Set((Array.isArray(assignedStoreIds) ? assignedStoreIds : [requestedStoreId || req.user.store_id]).filter(Boolean))];

    if (!isGlobal && (!normalizedAssignedStoreIds.length || normalizedAssignedStoreIds.some((storeId) => !accessibleStoreIds.includes(storeId)))) {
      return res.status(403).json({ error: 'You do not have access to that site' });
    }

    const ownerSourceStoreId = normalizedAssignedStoreIds[0] || req.user.store_id;
    const storeOwner = await getStoreOwnerId(ownerSourceStoreId);
    if (!storeOwner) return res.status(404).json({ error: 'Store not found' });

    const id = uuidv4();
    const primaryStoreId = normalizedAssignedStoreIds[0] || null;
    await pool.query(
      'INSERT INTO categories (id, store_id, owner_profile_id, name, is_global, assigned_store_ids) VALUES (?, ?, ?, ?, ?, ?)',
      [id, primaryStoreId, storeOwner.owner_profile_id, name.trim(), Boolean(isGlobal), Boolean(isGlobal) ? null : JSON.stringify(normalizedAssignedStoreIds)]
    );
    res.status(201).json({
      id,
      store_id: primaryStoreId,
      owner_profile_id: storeOwner.owner_profile_id,
      name: name.trim(),
      is_global: Boolean(isGlobal),
      assigned_store_ids: Boolean(isGlobal) ? [] : normalizedAssignedStoreIds,
      store_name: storeOwner.name,
    });
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
    const accessibleStoreIds = await getAccessibleStoreIds(req.user);
    if (!accessibleStoreIds.length) return res.status(403).json({ error: 'No store associated' });

    const [rows] = await pool.query('SELECT id, store_id, owner_profile_id, is_global, assigned_store_ids FROM categories WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Category not found' });

    const category = rows[0];
    const assignedStoreIds = parseAssignedStoreIds(category.assigned_store_ids);
    const canDeleteGlobal = category.is_global && req.user.role === 'admin' && category.owner_profile_id === req.user.id;
    const canDeleteScoped = (category.store_id && accessibleStoreIds.includes(category.store_id)) || assignedStoreIds.some((storeId) => accessibleStoreIds.includes(storeId));
    if (!canDeleteGlobal && !canDeleteScoped) {
      return res.status(403).json({ error: 'You do not have access to that category' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
