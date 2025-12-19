-- D1 Migrations for Security Enhancements
-- Run this migration to add security-related tables and columns

-- 1. Add is_admin column to users table (if not exists)
-- Note: SQLite doesn't support IF NOT EXISTS for columns, so this may error if column exists
-- ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- 2. Create processed_webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON processed_webhook_events(event_id);

-- 3. Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);

-- 4. Add carrier column to dogs table for shipment tracking (if not exists)
-- ALTER TABLE dogs ADD COLUMN carrier TEXT;

-- Notes:
-- - is_admin column may need to be added manually if it doesn't exist: wrangler d1 execute holistic-dog-db --remote --command "ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"
-- - carrier column may need to be added manually if it doesn't exist: wrangler d1 execute holistic-dog-db --remote --command "ALTER TABLE dogs ADD COLUMN carrier TEXT"
