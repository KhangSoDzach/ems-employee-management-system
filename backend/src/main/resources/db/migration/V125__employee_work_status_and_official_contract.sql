DELIMITER $$

DROP PROCEDURE IF EXISTS add_employee_work_status_columns$$
CREATE PROCEDURE add_employee_work_status_columns()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'work_status') THEN
        ALTER TABLE employees ADD COLUMN work_status VARCHAR(20) NOT NULL DEFAULT 'PROBATION';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'contract_start_date') THEN
        ALTER TABLE employees ADD COLUMN contract_start_date DATE NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'probation_salary') THEN
        ALTER TABLE employees ADD COLUMN probation_salary DECIMAL(15, 2) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'official_salary') THEN
        ALTER TABLE employees ADD COLUMN official_salary DECIMAL(15, 2) NULL;
    END IF;
END$$

DELIMITER ;
CALL add_employee_work_status_columns();
DROP PROCEDURE IF EXISTS add_employee_work_status_columns;

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

CREATE INDEX idx_employee_work_status ON employees (work_status);
