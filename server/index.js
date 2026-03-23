require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const authRoutes = require('./routes/auth.routes');
const ordersRoutes = require('./routes/orders.routes');
const menuRoutes = require('./routes/menu.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const staffRoutes = require('./routes/staff.routes');
const categoriesRoutes = require('./routes/categories.routes');

const app = express();
const PORT = process.env.PORT || 3000;

async function ensureOrderColumns() {
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL DEFAULT NULL AFTER status,
      ADD COLUMN IF NOT EXISTS review_rating TINYINT NULL AFTER payment_status,
      ADD COLUMN IF NOT EXISTS review_comment TEXT NULL AFTER review_rating
  `);
}

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/categories', categoriesRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

ensureOrderColumns()
  .catch((error) => {
    console.error('Schema sync error:', error);
    process.exit(1);
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ServeSync API running on http://localhost:${PORT}`);
    });
  });
