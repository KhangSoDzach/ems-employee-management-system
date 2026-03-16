-- Ensure asset_history matches current JPA entity (actor_id, detail, notes)
-- Safe for mixed environments (old schema with actor_user_id, or newer schema).

-- 1) Add missing actor_id column
SET @has_actor_id = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_history'
      AND COLUMN_NAME = 'actor_id'
);
SET @ddl = IF(
    @has_actor_id = 0,
    'ALTER TABLE asset_history ADD COLUMN actor_id BIGINT NULL AFTER action_type',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Add missing detail column
SET @has_detail = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_history'
      AND COLUMN_NAME = 'detail'
);
SET @ddl = IF(
    @has_detail = 0,
    'ALTER TABLE asset_history ADD COLUMN detail VARCHAR(500) NULL AFTER actor_username',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Add missing notes column
SET @has_notes = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_history'
      AND COLUMN_NAME = 'notes'
);
SET @ddl = IF(
    @has_notes = 0,
    'ALTER TABLE asset_history ADD COLUMN notes TEXT NULL AFTER new_value',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Backfill actor_id from legacy actor_user_id if present
SET @has_actor_user_id = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_history'
      AND COLUMN_NAME = 'actor_user_id'
);
SET @ddl = IF(
    @has_actor_user_id = 1,
    'UPDATE asset_history SET actor_id = actor_user_id WHERE actor_id IS NULL',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) Ensure FK exists for actor_id -> users(id)
SET @has_fk_actor_id = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS tc
    JOIN information_schema.KEY_COLUMN_USAGE kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
     AND tc.TABLE_NAME = kcu.TABLE_NAME
    WHERE tc.TABLE_SCHEMA = DATABASE()
      AND tc.TABLE_NAME = 'asset_history'
      AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND kcu.COLUMN_NAME = 'actor_id'
);
SET @ddl = IF(
    @has_fk_actor_id = 0,
    'ALTER TABLE asset_history ADD CONSTRAINT fk_asset_history_actor_id FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) Ensure index for actor_id exists
SET @has_idx_actor_id = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset_history'
      AND INDEX_NAME = 'idx_asset_history_actor_id'
);
SET @ddl = IF(
    @has_idx_actor_id = 0,
    'CREATE INDEX idx_asset_history_actor_id ON asset_history(actor_id)',
    'SELECT 1'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
