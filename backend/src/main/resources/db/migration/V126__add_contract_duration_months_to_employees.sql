ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS contract_duration_months INT NULL;

UPDATE employees
SET contract_duration_months = CASE
    WHEN contract_start_date IS NOT NULL AND contract_end_date IS NOT NULL
    THEN TIMESTAMPDIFF(MONTH, contract_start_date, DATE_ADD(contract_end_date, INTERVAL 1 DAY))
    ELSE NULL
END
WHERE contract_duration_months IS NULL;
