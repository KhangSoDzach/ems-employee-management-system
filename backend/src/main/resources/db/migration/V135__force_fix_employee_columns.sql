-- Safer version of V135 using a stored procedure to simulate 'IF NOT EXISTS'
-- Required for MySQL 5.5 compatibility where 'ADD COLUMN IF NOT EXISTS' is unsupported

DROP PROCEDURE IF EXISTS AddColumnIfMissing;

DELIMITER //

CREATE PROCEDURE AddColumnIfMissing(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Add columns missing from V125/V126
CALL AddColumnIfMissing('employees', 'contract_start_date', 'DATE NULL');
CALL AddColumnIfMissing('employees', 'probation_salary', 'DECIMAL(15, 2) NULL');
CALL AddColumnIfMissing('employees', 'official_salary', 'DECIMAL(15, 2) NULL');
CALL AddColumnIfMissing('employees', 'contract_duration_months', 'INT NULL');
CALL AddColumnIfMissing('employees', 'salary', 'DECIMAL(15, 2) NOT NULL DEFAULT 0.00');

DROP PROCEDURE IF EXISTS AddColumnIfMissing;

-- Backfill logic
UPDATE employees SET work_status = CASE
    WHEN status = 'TERMINATED' THEN 'TERMINATED'
    WHEN status = 'ACTIVE' THEN 'ACTIVE'
    ELSE 'PROBATION'
END WHERE work_status IS NOT NULL;

UPDATE employees SET probation_salary = COALESCE(probation_salary, salary) WHERE probation_salary IS NULL;
UPDATE employees SET official_salary = COALESCE(official_salary, salary) WHERE (status = 'ACTIVE' OR work_status = 'ACTIVE') AND official_salary IS NULL;

-- Backfill duration
UPDATE employees SET contract_duration_months = TIMESTAMPDIFF(MONTH, contract_start_date, DATE_ADD(contract_end_date, INTERVAL 1 DAY))
WHERE contract_start_date IS NOT NULL AND contract_end_date IS NOT NULL AND contract_duration_months IS NULL;

-- Cleanup history to allow re-run of V135 after repair
-- (Flyway repair handles this, but we're being safe)
