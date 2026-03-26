ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS work_status VARCHAR(20) NOT NULL DEFAULT 'PROBATION',
    ADD COLUMN IF NOT EXISTS contract_start_date DATE NULL,
    ADD COLUMN IF NOT EXISTS probation_salary DECIMAL(15, 2) NULL,
    ADD COLUMN IF NOT EXISTS official_salary DECIMAL(15, 2) NULL;

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
