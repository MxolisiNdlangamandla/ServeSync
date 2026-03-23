const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

function parseOrder(row) {
  return { ...row, items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items };
}

// GET /api/orders  (staff — scoped to store, with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated with this account' });

    const status = req.query.status;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    let sql = 'SELECT * FROM orders WHERE store_id = ?';
    const params = [storeId];
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(parseOrder));
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id  (public — requires access_token for unauthenticated)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];

    // If no valid JWT, require access_token query param
    const header = req.headers.authorization;
    let authenticated = false;
    if (header && header.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        if (decoded.store_id === order.store_id) authenticated = true;
      } catch { /* invalid token — fall through to access_token check */ }
    }

    if (!authenticated) {
      const token = req.query.token;
      if (order.access_token !== token) {
        return res.status(403).json({ error: 'Invalid access token' });
      }
    }

    res.json(parseOrder(order));
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders  (staff — creates order scoped to store)
router.post('/', auth, async (req, res) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) return res.status(403).json({ error: 'No store associated with this account' });

    const { table_number, items, notes, customer_name, access_token } = req.body;
    if (!table_number || !items?.length) {
      return res.status(400).json({ error: 'table_number and items are required' });
    }
    const id = uuidv4();
    const token = access_token || uuidv4();
    await pool.query(
      'INSERT INTO orders (id, store_id, table_number, customer_name, items, notes, access_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, storeId, table_number, customer_name || null, JSON.stringify(items), notes || null, token]
    );
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.status(201).json(parseOrder(rows[0]));
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PATCH /api/orders/:id  (staff via JWT or customer via access_token)
router.patch('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = rows[0];

    // Authenticate: JWT or access_token
    const header = req.headers.authorization;
    let isStaff = false;
    if (header && header.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        if (decoded.store_id === order.store_id) isStaff = true;
      } catch { /* fall through */ }
    }
    if (!isStaff) {
      const token = req.query.token || req.body.access_token;
      if (order.access_token !== token) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Customer can only update certain fields
    const staffAllowed = ['status', 'call_staff', 'request_bill', 'payment_status', 'items', 'notes', 'customer_name', 'review_rating', 'review_comment'];
    const customerAllowed = ['call_staff', 'request_bill', 'items', 'payment_status', 'review_rating', 'review_comment'];
    const allowed = isStaff ? staffAllowed : customerAllowed;

    const fields = [];
    const values = [];

    if (!isStaff && (req.body.review_rating !== undefined || req.body.review_comment !== undefined) && order.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted after an order is completed' });
    }

    if (req.body.review_rating !== undefined) {
      const rating = Number(req.body.review_rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Review rating must be between 1 and 5' });
      }
    }

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'status' && req.body[key] === 'completed') {
          fields.push('completed_at = CURRENT_TIMESTAMP');
          fields.push('call_staff = FALSE');
          fields.push('request_bill = FALSE');
        }

        if (key === 'status' && req.body[key] !== 'completed') {
          fields.push('completed_at = NULL');
        }

        fields.push(`${key} = ?`);
        values.push(key === 'items' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(req.params.id);
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
