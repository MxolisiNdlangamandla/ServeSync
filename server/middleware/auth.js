const jwt = require('jsonwebtoken');
const pool = require('../db');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = decoded;

    // Resolve store_id from profile if not in token
    if (!decoded.store_id) {
      const [rows] = await pool.query('SELECT store_id FROM profiles WHERE id = ?', [decoded.id]);
      if (rows.length) req.user.store_id = rows[0].store_id;
    }

    await pool.query('UPDATE profiles SET is_online = TRUE, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [decoded.id]);

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
