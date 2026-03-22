const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, store_id: user.store_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, storeName, industry } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM profiles WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const storeId = uuidv4();
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO profiles (id, full_name, email, password_hash, role, store_id, store_name, industry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, fullName || null, email, hash, 'admin', storeId, storeName || null, industry || 'restaurant']
    );

    const user = { id, email, role: 'admin', store_id: storeId, full_name: fullName || null, store_name: storeName || null, industry: industry || 'restaurant', subscription_tier: 'tier1' };
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM profiles WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, store_id: user.store_id, full_name: user.full_name, store_name: user.store_name, industry: user.industry, subscription_tier: user.subscription_tier }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/accept-invite — set password for invited staff
router.post('/accept-invite', async (req, res) => {
  try {
    const { token: inviteToken, password } = req.body;
    if (!inviteToken || !password) {
      return res.status(400).json({ error: 'Invite token and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [rows] = await pool.query('SELECT * FROM profiles WHERE invite_token = ?', [inviteToken]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Invalid or expired invite link' });
    }

    const user = rows[0];
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE profiles SET password_hash = ?, invite_token = NULL WHERE id = ?', [hash, user.id]);

    const jwtToken = signToken(user);
    res.json({
      token: jwtToken,
      user: { id: user.id, email: user.email, role: user.role, store_id: user.store_id, full_name: user.full_name, store_name: user.store_name, industry: user.industry, subscription_tier: user.subscription_tier }
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// GET /api/auth/me  — get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, store_id, store_name, industry, subscription_tier FROM profiles WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/auth/profile — update current user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const allowed = ['full_name', 'store_name'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(req.user.id);
    await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, store_id, store_name, industry, subscription_tier FROM profiles WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
