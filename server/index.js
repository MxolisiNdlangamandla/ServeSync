require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const ordersRoutes = require('./routes/orders.routes');
const menuRoutes = require('./routes/menu.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const staffRoutes = require('./routes/staff.routes');
const categoriesRoutes = require('./routes/categories.routes');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`ServeSync API running on http://localhost:${PORT}`);
});
