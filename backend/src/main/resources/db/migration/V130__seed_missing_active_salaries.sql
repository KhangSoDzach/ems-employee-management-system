-- Seed active salary rows for employees that still do not have an active salary.
-- This migration is idempotent and safe to run multiple times.

INSERT INTO salaries (
    employee_id,
    basic_salary,
    allowances,
    deductions,
    net_salary,
    effective_from,
    effective_to,
    currency,
    change_reason,
    created_at,
    updated_at,
    is_deleted
)
SELECT
    e.id AS employee_id,
    ROUND(
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
    ) AS basic_salary,
    0 AS allowances,
    0 AS deductions,
    ROUND(
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
    ) AS net_salary,
    COALESCE(e.hire_date, CURDATE()) AS effective_from,
    NULL AS effective_to,
    'VND' AS currency,
    'Auto-seed active salary from employee salary fields (V130)' AS change_reason,
    NOW() AS created_at,
    NOW() AS updated_at,
    0 AS is_deleted
FROM employees e
WHERE e.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM salaries s
      WHERE s.employee_id = e.id
        AND s.is_deleted = 0
        AND s.effective_from <= CURDATE()
        AND (s.effective_to IS NULL OR s.effective_to >= CURDATE())
  );
