SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'contract_duration_months'
);
SET @sql := IF(
    @col_exists = 0,
    'ALTER TABLE employees ADD COLUMN contract_duration_months INT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE employees
SET contract_duration_months = CASE
    WHEN contract_start_date IS NOT NULL AND contract_end_date IS NOT NULL
    THEN TIMESTAMPDIFF(MONTH, contract_start_date, DATE_ADD(contract_end_date, INTERVAL 1 DAY))
    ELSE NULL
END
WHERE contract_duration_months IS NULL;
