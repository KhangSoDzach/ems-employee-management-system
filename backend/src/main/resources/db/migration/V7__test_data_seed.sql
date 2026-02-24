-- 1. DEPARTMENTS (is_active NOT NULL)
INSERT IGNORE INTO departments (id, code, name, description, is_active, created_at, updated_at, is_deleted, version)
VALUES
(1, 'HR',  'Human Resources',  'HR Department',        TRUE, NOW(), NOW(), FALSE, 0),
(2, 'ENG', 'Engineering',      'Software Engineering', TRUE, NOW(), NOW(), FALSE, 0),
(3, 'FIN', 'Finance',          'Finance Department',   TRUE, NOW(), NOW(), FALSE, 0);

-- 2. POSITIONS (column = 'title', is_active + level NOT NULL)
INSERT IGNORE INTO positions (id, code, title, description, level, is_active, created_at, updated_at, is_deleted, version)
VALUES
(1, 'HR-MGR',  'HR Manager',           'HR Manager',         3, TRUE, NOW(), NOW(), FALSE, 0),
(2, 'ENG-MGR', 'Engineering Manager',  'Engineering Manager',3, TRUE, NOW(), NOW(), FALSE, 0),
(3, 'SWE',     'Software Engineer',    'Software Engineer',  1, TRUE, NOW(), NOW(), FALSE, 0),
(4, 'SWE-SR',  'Senior Engineer',      'Senior Engineer',    2, TRUE, NOW(), NOW(), FALSE, 0);

-- 3. USERS
INSERT IGNORE INTO users (username, email, password, enabled,
    account_non_expired, account_non_locked, credentials_non_expired,
    failed_login_attempts, created_at, updated_at, is_deleted, version)
VALUES
('manager1',  'manager1@ems.company.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
('employee1', 'employee1@ems.company.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
('employee2', 'employee2@ems.company.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0);

-- 4. ROLES
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.username = 'manager1'  AND r.name = 'ROLE_MANAGER';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.username = 'employee1' AND r.name = 'ROLE_EMPLOYEE';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.username = 'employee2' AND r.name = 'ROLE_EMPLOYEE';

-- 5. EMPLOYEES (manager trước, employee sau vì FK reporting_manager_id)
-- admin employee record
INSERT IGNORE INTO employees (
    first_name, last_name, email, phone, hire_date, status,
    department_id, position_id, user_id,
    created_at, updated_at, is_deleted, version)
SELECT 'Admin', 'System', 'admin@ems.company.com', '0900000000',
       '2020-01-01', 'ACTIVE', 1, 1, u.id,
       NOW(), NOW(), FALSE, 0
FROM users u WHERE u.username = 'admin';

-- manager1 employee record
INSERT IGNORE INTO employees (
    first_name, last_name, email, phone, hire_date, status,
    department_id, position_id, user_id,
    created_at, updated_at, is_deleted, version)
SELECT 'Nguyen', 'Manager', 'manager1@ems.company.com', '0911111111',
       '2021-06-01', 'ACTIVE', 2, 2, u.id,
       NOW(), NOW(), FALSE, 0
FROM users u WHERE u.username = 'manager1';

-- employee1 → báo cáo cho manager1
INSERT IGNORE INTO employees (
    first_name, last_name, email, phone, hire_date, status,
    department_id, position_id, user_id, reporting_manager_id,
    created_at, updated_at, is_deleted, version)
SELECT 'Tran', 'Employee1', 'employee1@ems.company.com', '0922222222',
       '2022-03-15', 'ACTIVE', 2, 3, u.id,
       (SELECT e2.id FROM employees e2
        JOIN users u2 ON e2.user_id = u2.id
        WHERE u2.username = 'manager1' LIMIT 1),
       NOW(), NOW(), FALSE, 0
FROM users u WHERE u.username = 'employee1';

-- employee2 → báo cáo cho manager1
INSERT IGNORE INTO employees (
    first_name, last_name, email, phone, hire_date, status,
    department_id, position_id, user_id, reporting_manager_id,
    created_at, updated_at, is_deleted, version)
SELECT 'Le', 'Employee2', 'employee2@ems.company.com', '0933333333',
       '2023-01-10', 'ACTIVE', 2, 4, u.id,
       (SELECT e2.id FROM employees e2
        JOIN users u2 ON e2.user_id = u2.id
        WHERE u2.username = 'manager1' LIMIT 1),
       NOW(), NOW(), FALSE, 0
FROM users u WHERE u.username = 'employee2';

-- 6. LEAVE REQUESTS (PENDING - để test approve)
INSERT IGNORE INTO leaves (
    employee_id, leave_type, start_date, end_date, total_days,
    reason, status, is_half_day, is_paid, is_emergency,
    created_at, updated_at, is_deleted, version)
SELECT e.id,
       'ANNUAL',
       DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY),
       DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY),
       3,
       'Nghỉ phép năm',
       'PENDING', FALSE, TRUE, FALSE,
       NOW(), NOW(), FALSE, 0
FROM employees e JOIN users u ON e.user_id = u.id
WHERE u.username = 'employee1';

INSERT IGNORE INTO leaves (
    employee_id, leave_type, start_date, end_date, total_days,
    reason, status, is_half_day, is_paid, is_emergency,
    created_at, updated_at, is_deleted, version)
SELECT e.id,
       'SICK',
       DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY),
       DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY),
       1,
       'Ốm nghỉ điều trị',
       'PENDING', FALSE, TRUE, FALSE,
       NOW(), NOW(), FALSE, 0
FROM employees e JOIN users u ON e.user_id = u.id
WHERE u.username = 'employee2';