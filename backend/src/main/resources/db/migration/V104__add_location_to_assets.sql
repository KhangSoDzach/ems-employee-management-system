-- Step 1: Add 'location' column to assets if it does not already exist
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'assets'
      AND COLUMN_NAME  = 'location'
);

SET @ddl = IF(
    @col_exists = 0,
    'ALTER TABLE assets ADD COLUMN location VARCHAR(255) NULL COMMENT ''VD: Kho HN, Văn phòng L81'' AFTER asset_condition',
    'SELECT 1 -- location column already exists, skipping'
);

PREPARE _stmt FROM @ddl;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

-- Step 2: Backfill location values for seed rows inserted by V99
-- (Uses UPDATE so it is safe to run even if the rows were inserted
--  without location or if V99 is re-run with location already set.)
UPDATE assets SET location = 'Văn phòng L81' WHERE id = 1 AND (location IS NULL OR location = '');
UPDATE assets SET location = 'Văn phòng L81' WHERE id = 2 AND (location IS NULL OR location = '');
UPDATE assets SET location = 'Kho HN'        WHERE id = 3 AND (location IS NULL OR location = '');
UPDATE assets SET location = 'Văn phòng L81' WHERE id = 4 AND (location IS NULL OR location = '');
