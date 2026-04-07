-- =====================================
-- V121: Default annual leave = 12 and sync profile leave balance
-- Description:
--   1) Ensure employee.annual_leave_balance has default 12
--   2) Backfill current-year ANNUAL leave_balances (12 days) where missing
--   3) Sync employees.annual_leave_balance from current-year leave_balances
-- Author: EMS Backend Team
-- Date: 2026-03-23
-- =====================================

UPDATE employees
SET annual_leave_balance = CASE
    WHEN annual_leave_balance IS NULL THEN 12
    WHEN TRIM(CAST(annual_leave_balance AS CHAR)) REGEXP '^-?[0-9]+$'
        THEN CAST(TRIM(CAST(annual_leave_balance AS CHAR)) AS SIGNED)
    ELSE 12
END;

ALTER TABLE employees
    MODIFY COLUMN annual_leave_balance INT NOT NULL DEFAULT 12;

INSERT INTO leave_balances (
    created_at,
    updated_at,
    created_by,
    updated_by,
    version,
    deleted_at,
    is_deleted,
    deleted_by,
    employee_id,
    year,
    leave_type,
    total_days,
    used_days,
    remaining_days,
    carried_forward_days,
    expiry_date,
    allow_carry_forward,
    max_carry_forward,
    notes
)
SELECT
    NOW(6),
    NOW(6),
    'flyway',
    'flyway',
    0,
    NULL,
    FALSE,
    NULL,
    e.id,
    YEAR(CURDATE()),
    'ANNUAL',
    12,
    0,
    12,
    0,
    STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-12-31'), '%Y-%m-%d'),
    TRUE,
    NULL,
    'Default annual leave quota (12 days)'
FROM employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM leave_balances lb
    WHERE lb.employee_id = e.id
      AND lb.year = YEAR(CURDATE())
      AND lb.leave_type = 'ANNUAL'
);

UPDATE employees e
LEFT JOIN leave_balances lb
    ON lb.employee_id = e.id
   AND lb.year = YEAR(CURDATE())
   AND lb.leave_type = 'ANNUAL'
SET e.annual_leave_balance = COALESCE(lb.remaining_days, 12);
