-- Backfill employee profile baseline fields and fix zero-salary records used by payroll.
-- This migration is idempotent and safe to run multiple times.

-- 1) Fill missing employee profile fields for seeded/demo data so HR screens are complete.
UPDATE employees e
SET
    e.address = CASE
        WHEN e.address IS NULL OR TRIM(e.address) = ''
            THEN CONCAT('So ', LPAD(CAST(e.id AS CHAR), 3, '0'), ' Duong Nguyen Hue')
        ELSE e.address
    END,
    e.city = CASE
        WHEN e.city IS NULL OR TRIM(e.city) = '' THEN 'Ho Chi Minh'
        ELSE e.city
    END,
    e.state = CASE
        WHEN e.state IS NULL OR TRIM(e.state) = '' THEN 'TP.HCM'
        ELSE e.state
    END,
    e.country = CASE
        WHEN e.country IS NULL OR TRIM(e.country) = '' THEN 'Vietnam'
        ELSE e.country
    END,
    e.social_security_number = CASE
        WHEN e.social_security_number IS NULL OR TRIM(e.social_security_number) = ''
            THEN CONCAT('BHXH', LPAD(CAST(e.id AS CHAR), 8, '0'))
        ELSE e.social_security_number
    END,
    e.bank_name = CASE
        WHEN e.bank_name IS NULL OR TRIM(e.bank_name) = '' THEN 'Vietcombank'
        ELSE e.bank_name
    END,
    e.bank_branch = CASE
        WHEN e.bank_branch IS NULL OR TRIM(e.bank_branch) = '' THEN 'Chi nhanh Sai Gon'
        ELSE e.bank_branch
    END,
    e.bank_account_number = CASE
        WHEN e.bank_account_number IS NULL OR TRIM(e.bank_account_number) = ''
            THEN CONCAT('9', LPAD(CAST(e.id AS CHAR), 11, '0'))
        ELSE e.bank_account_number
    END,
    e.updated_at = NOW()
WHERE e.status = 'ACTIVE';

-- 2) Ensure employee salary columns are not left as zero for active employees.
UPDATE employees e
SET
    e.salary = ROUND(
        CASE
            WHEN e.official_salary IS NOT NULL AND e.official_salary > 0 THEN e.official_salary
            WHEN e.probation_salary IS NOT NULL AND e.probation_salary > 0 THEN e.probation_salary
            WHEN e.salary IS NOT NULL AND e.salary > 0 THEN e.salary
            WHEN e.contract_type = 'INTERN' THEN 5000000
            WHEN e.contract_type = 'PART_TIME' THEN 7000000
            WHEN e.contract_type = 'CONTRACT' THEN 10000000
            ELSE 12000000
        END,
        2
    ),
    e.probation_salary = ROUND(
        CASE
            WHEN e.probation_salary IS NOT NULL AND e.probation_salary > 0 THEN e.probation_salary
            WHEN e.salary IS NOT NULL AND e.salary > 0 THEN e.salary
            WHEN e.official_salary IS NOT NULL AND e.official_salary > 0 THEN e.official_salary
            WHEN e.contract_type = 'INTERN' THEN 5000000
            WHEN e.contract_type = 'PART_TIME' THEN 7000000
            WHEN e.contract_type = 'CONTRACT' THEN 10000000
            ELSE 12000000
        END,
        2
    ),
    e.updated_at = NOW()
WHERE e.status = 'ACTIVE'
  AND (e.salary IS NULL OR e.salary <= 0 OR e.probation_salary IS NULL OR e.probation_salary <= 0);

-- 3) Fix currently active salary rows that were seeded with basic_salary = 0.
UPDATE salaries s
JOIN employees e ON e.id = s.employee_id
SET
    s.basic_salary = ROUND(
        CASE
            WHEN e.official_salary IS NOT NULL AND e.official_salary > 0 THEN e.official_salary
            WHEN e.probation_salary IS NOT NULL AND e.probation_salary > 0 THEN e.probation_salary
            WHEN e.salary IS NOT NULL AND e.salary > 0 THEN e.salary
            WHEN e.contract_type = 'INTERN' THEN 5000000
            WHEN e.contract_type = 'PART_TIME' THEN 7000000
            WHEN e.contract_type = 'CONTRACT' THEN 10000000
            ELSE 12000000
        END,
        2
    ),
    s.net_salary = ROUND(
        CASE
            WHEN e.official_salary IS NOT NULL AND e.official_salary > 0 THEN e.official_salary
            WHEN e.probation_salary IS NOT NULL AND e.probation_salary > 0 THEN e.probation_salary
            WHEN e.salary IS NOT NULL AND e.salary > 0 THEN e.salary
            WHEN e.contract_type = 'INTERN' THEN 5000000
            WHEN e.contract_type = 'PART_TIME' THEN 7000000
            WHEN e.contract_type = 'CONTRACT' THEN 10000000
            ELSE 12000000
        END,
        2
    ),
    s.allowances = COALESCE(s.allowances, 0),
    s.deductions = COALESCE(s.deductions, 0),
    s.updated_at = NOW(),
    s.change_reason = 'Backfill positive baseline salary from employee data (V131)'
WHERE e.status = 'ACTIVE'
  AND s.is_deleted = 0
  AND s.effective_from <= CURDATE()
  AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())
  AND (s.basic_salary IS NULL OR s.basic_salary <= 0);
