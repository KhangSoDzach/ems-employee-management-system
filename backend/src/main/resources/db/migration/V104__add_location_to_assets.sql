SET @has_deleted = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'deleted');
SET @ddl = IF(@has_deleted = 0,
    'ALTER TABLE assets ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- location (VARCHAR 255)
SET @has_location = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'location');
SET @ddl = IF(@has_location = 0,
    'ALTER TABLE assets ADD COLUMN location VARCHAR(255) NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- image_url (VARCHAR 500)
SET @has_image_url = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'image_url');
SET @ddl = IF(@has_image_url = 0,
    'ALTER TABLE assets ADD COLUMN image_url VARCHAR(500) NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- purchase_date (DATE)
SET @has_purchase_date = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'purchase_date');
SET @ddl = IF(@has_purchase_date = 0,
    'ALTER TABLE assets ADD COLUMN purchase_date DATE NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- asset_value (DECIMAL 18,2)
SET @has_asset_value = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'asset_value');
SET @ddl = IF(@has_asset_value = 0,
    'ALTER TABLE assets ADD COLUMN asset_value DECIMAL(18,2) NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- assigned_by_id (BIGINT FK to users)
SET @has_assigned_by = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'assigned_by_id');
SET @ddl = IF(@has_assigned_by = 0,
    'ALTER TABLE assets ADD COLUMN assigned_by_id BIGINT NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- supplier_name (VARCHAR 255)
SET @has_supplier = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'supplier_name');
SET @ddl = IF(@has_supplier = 0,
    'ALTER TABLE assets ADD COLUMN supplier_name VARCHAR(255) NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- contract_until (DATE)
SET @has_contract_until = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'contract_until');
SET @ddl = IF(@has_contract_until = 0,
    'ALTER TABLE assets ADD COLUMN contract_until DATE NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- contract_number (VARCHAR 100)
SET @has_contract_num = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'contract_number');
SET @ddl = IF(@has_contract_num = 0,
    'ALTER TABLE assets ADD COLUMN contract_number VARCHAR(100) NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- notes (TEXT)
SET @has_notes = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'notes');
SET @ddl = IF(@has_notes = 0,
    'ALTER TABLE assets ADD COLUMN notes TEXT NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- created_by_id (BIGINT FK to users)
SET @has_created_by = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'created_by_id');
SET @ddl = IF(@has_created_by = 0,
    'ALTER TABLE assets ADD COLUMN created_by_id BIGINT NULL',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- Index on deleted (only if not yet present)
SET @has_idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND INDEX_NAME = 'idx_assets_deleted');
SET @ddl = IF(@has_idx = 0,
    'ALTER TABLE assets ADD INDEX idx_assets_deleted (deleted)',
    'SELECT 1');
PREPARE _s FROM @ddl; EXECUTE _s; DEALLOCATE PREPARE _s;

-- Backfill location for seed rows inserted by V99 (idempotent)
UPDATE assets SET location = 'Van phong L81' WHERE id IN (1, 2, 4) AND (location IS NULL OR location = '');
UPDATE assets SET location = 'Kho HN'        WHERE id = 3          AND (location IS NULL OR location = '');