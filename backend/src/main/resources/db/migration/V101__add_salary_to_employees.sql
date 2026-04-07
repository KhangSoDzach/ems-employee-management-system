
SET @col_exists = (
        SELECT COUNT(1)
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
            AND table_name = 'employees'
            AND column_name = 'salary'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE employees ADD COLUMN salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT ''Gross salary in VND''', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
