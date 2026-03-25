-- Migration: add store scoping, customer_name, invite_token
-- Run once against an existing servesync database to add columns introduced in the
-- multi-tenancy & invite-flow update.
-- NOTE: MySQL does not support ALTER TABLE ADD COLUMN IF NOT EXISTS, so running
-- this a second time on an already-migrated DB will produce harmless "Duplicate column" errors.

USE servesync;

-- ── profiles ──────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN store_id VARCHAR(36) AFTER role;
ALTER TABLE profiles ADD COLUMN invite_token VARCHAR(36) AFTER store_name;
ALTER TABLE profiles ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT FALSE AFTER invite_token;
ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMP NULL DEFAULT NULL AFTER is_online;
CREATE INDEX idx_profiles_store_id ON profiles (store_id);

-- Backfill: give every existing admin a unique store_id
UPDATE profiles SET store_id = UUID() WHERE store_id IS NULL AND role = 'admin';

-- Extend subscription tiers to include Essentials without changing existing paid users
ALTER TABLE profiles MODIFY COLUMN subscription_tier ENUM('tier1','tier2','tier3','tier4') NOT NULL DEFAULT 'tier1';

-- ── orders ────────────────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN store_id VARCHAR(36) NOT NULL DEFAULT '' AFTER id;
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255) AFTER table_number;
CREATE INDEX idx_orders_store_status ON orders (store_id, status);
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- ── menu_items ────────────────────────────────────────────────────────
ALTER TABLE menu_items ADD COLUMN store_id VARCHAR(36) NOT NULL DEFAULT '' AFTER id;
CREATE INDEX idx_menu_store_id ON menu_items (store_id);

-- ── notifications ─────────────────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN store_id VARCHAR(36) NOT NULL DEFAULT '' AFTER id;
CREATE INDEX idx_notif_store_read ON notifications (store_id, `read`);
