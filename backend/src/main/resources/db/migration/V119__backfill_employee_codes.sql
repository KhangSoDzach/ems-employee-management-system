-- ============================================================
-- Migration V119: Backfill missing employee_code values
-- Employees 1-7 from V99 seed may have NULL employee_code
-- because they were first inserted without codes in earlier migrations
-- ============================================================

-- Backfill employee codes for old seed employees that have NULL codes
UPDATE employees SET employee_code = 'ADMIN2020-00001' WHERE id = 1 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'ENG202100001' WHERE id = 2 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'HR202000001'  WHERE id = 3 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'ENG202200001' WHERE id = 4 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'ENG202300001' WHERE id = 5 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'ENG202200002' WHERE id = 6 AND (employee_code IS NULL OR employee_code = '');
UPDATE employees SET employee_code = 'ENG202400001' WHERE id = 7 AND (employee_code IS NULL OR employee_code = '');
