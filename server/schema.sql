CREATE DATABASE IF NOT EXISTS servesync;
USE servesync;

-- Profiles / users
CREATE TABLE IF NOT EXISTS profiles (
  id          VARCHAR(36)  PRIMARY KEY,
  full_name   VARCHAR(255),
  email       VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        ENUM('admin','user') NOT NULL DEFAULT 'admin',
  store_id    VARCHAR(36),
  store_name  VARCHAR(255),
  invite_token VARCHAR(36),
  is_online   BOOLEAN      NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMP NULL DEFAULT NULL,
  industry    VARCHAR(50)  DEFAULT 'restaurant',
  subscription_tier ENUM('tier1','tier2','tier3') NOT NULL DEFAULT 'tier1',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_id (store_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id            VARCHAR(36)  PRIMARY KEY,
  store_id      VARCHAR(36)  NOT NULL,
  table_number  VARCHAR(50)  NOT NULL,
  customer_name VARCHAR(255),
  items         JSON         NOT NULL,
  status        ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  call_staff    BOOLEAN      NOT NULL DEFAULT FALSE,
  request_bill  BOOLEAN      NOT NULL DEFAULT FALSE,
  payment_status ENUM('unpaid','pending','paid') NOT NULL DEFAULT 'unpaid',
  notes         TEXT,
  access_token  VARCHAR(36)  NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_status (store_id, status),
  INDEX idx_created_at (created_at)
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id          VARCHAR(36)  PRIMARY KEY,
  store_id    VARCHAR(36)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  available   BOOLEAN      NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_id (store_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id            VARCHAR(36)  PRIMARY KEY,
  store_id      VARCHAR(36)  NOT NULL,
  order_id      VARCHAR(36),
  table_number  VARCHAR(50),
  type          ENUM('new_order','item_added','call_staff','bill_request') NOT NULL,
  message       TEXT         NOT NULL,
  `read`        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_store_read (store_id, `read`)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id        VARCHAR(36)  PRIMARY KEY,
  store_id  VARCHAR(36)  NOT NULL,
  name      VARCHAR(100) NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_store_category (store_id, name),
  INDEX idx_store_id (store_id)
);
