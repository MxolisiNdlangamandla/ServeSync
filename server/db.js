const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

let pool;

function sslConfig() {
  if (process.env.DB_SSL !== 'true') {
    return undefined;
  }

  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
  };
}

function baseConfig(includeDatabase = true) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00',
    ssl: sslConfig()
  };

  if (includeDatabase) {
    config.database = process.env.DB_NAME || 'servesync';
  }

  return config;
}

async function runSchema(targetPool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const statements = schema
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await targetPool.query(statement);
  }
}

async function columnExists(targetPool, tableName, columnName) {
  const dbName = process.env.DB_NAME || 'servesync';
  const [rows] = await targetPool.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [dbName, tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureLegacyMigrations(targetPool) {
  await targetPool.query(
    "ALTER TABLE profiles MODIFY COLUMN subscription_tier ENUM('tier1','tier2','tier3','tier4') NOT NULL DEFAULT 'tier1'"
  );

  if (!(await columnExists(targetPool, 'orders', 'completed_at'))) {
    await targetPool.query('ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL AFTER status');
  }

  if (!(await columnExists(targetPool, 'orders', 'review_rating'))) {
    await targetPool.query('ALTER TABLE orders ADD COLUMN review_rating TINYINT NULL AFTER payment_status');
  }

  if (!(await columnExists(targetPool, 'orders', 'review_comment'))) {
    await targetPool.query('ALTER TABLE orders ADD COLUMN review_comment TEXT AFTER review_rating');
  }
}

async function initDatabase() {
  if (pool) {
    return pool;
  }

  const dbName = process.env.DB_NAME || 'servesync';
  const bootstrap = await mysql.createConnection(baseConfig(false));

  try {
    await bootstrap.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await bootstrap.end();
  }

  pool = mysql.createPool(baseConfig(true));
  await runSchema(pool);
  await ensureLegacyMigrations(pool);
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database has not been initialized. Call initDatabase() before handling requests.');
  }

  return pool;
}

module.exports = {
  initDatabase,
  query(...args) {
    return getPool().query(...args);
  },
  execute(...args) {
    return getPool().execute(...args);
  },
  getConnection(...args) {
    return getPool().getConnection(...args);
  }
};
