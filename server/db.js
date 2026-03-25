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

async function indexExists(targetPool, tableName, indexName) {
  const dbName = process.env.DB_NAME || 'servesync';
  const [rows] = await targetPool.query(
    `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [dbName, tableName, indexName]
  );
  return rows.length > 0;
}

async function ensureLegacyMigrations(targetPool) {
  await targetPool.query(
    "ALTER TABLE profiles MODIFY COLUMN subscription_tier ENUM('tier1','tier2','tier3','tier4') NOT NULL DEFAULT 'tier1'"
  );
  await targetPool.query(
    "ALTER TABLE profiles MODIFY COLUMN role ENUM('admin','manager','supervisor','user') NOT NULL DEFAULT 'admin'"
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

  if (!(await columnExists(targetPool, 'categories', 'owner_profile_id'))) {
    await targetPool.query('ALTER TABLE categories ADD COLUMN owner_profile_id VARCHAR(36) NULL AFTER store_id');
  }

  if (!(await columnExists(targetPool, 'categories', 'is_global'))) {
    await targetPool.query('ALTER TABLE categories ADD COLUMN is_global BOOLEAN NOT NULL DEFAULT FALSE AFTER name');
  }

  if (!(await columnExists(targetPool, 'categories', 'assigned_store_ids'))) {
    await targetPool.query('ALTER TABLE categories ADD COLUMN assigned_store_ids JSON NULL AFTER is_global');
  }

  await targetPool.query('ALTER TABLE categories MODIFY COLUMN store_id VARCHAR(36) NULL');
  if (!(await indexExists(targetPool, 'categories', 'idx_owner_profile_id'))) {
    await targetPool.query('CREATE INDEX idx_owner_profile_id ON categories (owner_profile_id)');
  }
  if (!(await indexExists(targetPool, 'categories', 'idx_owner_global'))) {
    await targetPool.query('CREATE INDEX idx_owner_global ON categories (owner_profile_id, is_global)');
  }

  await targetPool.query(
    `UPDATE categories c
     JOIN stores s ON s.id = c.store_id
     SET c.owner_profile_id = s.owner_profile_id
     WHERE c.owner_profile_id IS NULL`
  );

  await targetPool.query(
    `UPDATE categories
     SET assigned_store_ids = JSON_ARRAY(store_id)
     WHERE store_id IS NOT NULL
       AND (assigned_store_ids IS NULL OR JSON_LENGTH(assigned_store_ids) = 0)`
  );

  await targetPool.query(
    `INSERT INTO stores (id, owner_profile_id, name)
     SELECT p.store_id, p.id, COALESCE(NULLIF(p.store_name, ''), 'Primary Store')
     FROM profiles p
     LEFT JOIN stores s ON s.id = p.store_id
     WHERE p.role = 'admin' AND p.store_id IS NOT NULL AND s.id IS NULL`
  );
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
