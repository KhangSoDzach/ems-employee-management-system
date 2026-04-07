SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'work_status'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE employees ADD COLUMN work_status VARCHAR(20) NOT NULL DEFAULT ''PROBATION''', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'contract_start_date'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE employees ADD COLUMN contract_start_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'probation_salary'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE employees ADD COLUMN probation_salary DECIMAL(15, 2) NULL', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'official_salary'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE employees ADD COLUMN official_salary DECIMAL(15, 2) NULL', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE employees
SET work_status = CASE
    WHEN status = 'TERMINATED' THEN 'TERMINATED'
    WHEN status = 'ACTIVE' THEN 'ACTIVE'
    ELSE 'PROBATION'
END;

UPDATE employees
SET probation_salary = COALESCE(probation_salary, salary)
WHERE probation_salary IS NULL;

UPDATE employees
SET official_salary = COALESCE(official_salary, salary)
WHERE work_status = 'ACTIVE' AND official_salary IS NULL;

SET @idx_exists = (
        SELECT COUNT(1)
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
            AND table_name = 'employees'
            AND index_name = 'idx_employee_work_status'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_employee_work_status ON employees (work_status)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
