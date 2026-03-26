-- Ensure audit identities show human names
-- Mapping based on user requirements for audit compliance

-- We omit work_status as it might be missing in some legacy DBs despite earlier migrations
-- We must include created_at and updated_at as they are NOT NULL in V6 schema
INSERT IGNORE INTO employees (user_id, first_name, last_name, email, hire_date, date_of_birth, employee_code, status, created_at, updated_at)
SELECT u.id, 'Hệ thống', 'Admin', 'admin@company.com', '2020-01-01', '1990-01-01', 'EMP001', 'ACTIVE', NOW(), NOW()
FROM users u WHERE u.username = 'admin'
AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);

UPDATE employees e
JOIN users u ON e.user_id = u.id
SET e.first_name = 'Trần Hoàng', e.last_name = 'Dev'
WHERE u.username = 'employee1';

INSERT IGNORE INTO employees (user_id, first_name, last_name, email, hire_date, date_of_birth, employee_code, status, created_at, updated_at)
SELECT u.id, 'Trần Hoàng', 'Dev', 'employee1@company.com', '2023-01-01', '1995-01-01', 'EMP002', 'ACTIVE', NOW(), NOW()
FROM users u WHERE u.username = 'employee1'
AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id);
