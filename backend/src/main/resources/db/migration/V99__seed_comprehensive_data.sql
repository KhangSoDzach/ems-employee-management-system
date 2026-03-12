-- 1. SYSTEM CONFIGURATION
-- Store basic office location and radius for check-in
INSERT IGNORE INTO system_configs (config_key, config_value, description, updated_by, created_at, updated_at)
VALUES
('OFFICE_LATITUDE', '10.762622', 'Vĩ độ vị trí văn phòng (Vinhomes Central Park - L81)', 'SYSTEM', NOW(), NOW()),
('OFFICE_LONGITUDE', '106.721862', 'Kinh độ vị trí văn phòng', 'SYSTEM', NOW(), NOW()),
('OFFICE_RADIUS_METERS', '200', 'Bán kính checkin cho phép (mét)', 'SYSTEM', NOW(), NOW()),
('LATE_THRESHOLD_MINUTES', '15', 'Số phút đi trễ tối đa cho phép', 'SYSTEM', NOW(), NOW());

-- 2. DEPARTMENTS
INSERT IGNORE INTO departments (id, code, name, description, is_active, created_at, updated_at, is_deleted, version)
VALUES
(1, 'HR',  'Human Resources',  'HR Department',        TRUE, NOW(), NOW(), FALSE, 0),
(2, 'ENG', 'Engineering',      'Software Engineering', TRUE, NOW(), NOW(), FALSE, 0),
(3, 'FIN', 'Finance',          'Finance Department',   TRUE, NOW(), NOW(), FALSE, 0),
(4, 'SAL', 'Sales',            'Phòng Kinh doanh',     TRUE, NOW(), NOW(), FALSE, 0),
(5, 'MAR', 'Marketing',        'Phòng Marketing',      TRUE, NOW(), NOW(), FALSE, 0),
(6, 'IT',  'IT Services',      'Dịch vụ CNTT',         TRUE, NOW(), NOW(), FALSE, 0);

-- 3. POSITIONS
INSERT IGNORE INTO positions (id, code, title, description, level, is_active, department_id, created_at, updated_at, is_deleted, version)
VALUES
(1, 'HR-MGR',  'Trưởng phòng HR',      'HR Manager Level',      3, TRUE, 1, NOW(), NOW(), FALSE, 0),
(2, 'ENG-MGR', 'Trưởng phòng Kỹ thuật','Engineering Manager',   3, TRUE, 2, NOW(), NOW(), FALSE, 0),
(3, 'SWE-SR',  'Lập trình viên Senior','Senior Software Eng',   2, TRUE, 2, NOW(), NOW(), FALSE, 0),
(4, 'SWE-JR',  'Lập trình viên Junior','Junior Software Eng',   1, TRUE, 2, NOW(), NOW(), FALSE, 0),
(5, 'SAL-MGR', 'Trưởng phòng Sales',   'Sales Manager',         3, TRUE, 4, NOW(), NOW(), FALSE, 0),
(6, 'SAL-EXC', 'Chuyên viên Sales',    'Sales Executive',      1, TRUE, 4, NOW(), NOW(), FALSE, 0),
(7, 'SOC-MED', 'Marketing Specialist', 'Social Media Marketing',1, TRUE, 5, NOW(), NOW(), FALSE, 0),
(8, 'IT-SUP',  'IT Support',           'IT Support Engineer',   1, TRUE, 6, NOW(), NOW(), FALSE, 0);

-- 4. USERS
-- Password is 'password' hashed
INSERT IGNORE INTO users (id, username, email, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, failed_login_attempts, created_at, updated_at, is_deleted, version)
VALUES
(1, 'admin',      'aex31625@gmail.com',     '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(2, 'manager1',   'manager1@ems.company.com',  '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(3, 'hr.user',    'hr@ems.company.com',        '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(4, 'employee1',  'employee1@ems.company.com', '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(5, 'employee2',  'employee2@ems.company.com', '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(6, 'sales.lead', 'sales@ems.company.com',     '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(7, 'it.support', 'it.sup@ems.company.com',    '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0);

-- 5. ROLES & PERMISSIONS (Assume roles already exist from V1/V2, just mapping)
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'admin'      AND r.name = 'ROLE_ADMIN';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'manager1'   AND r.name = 'ROLE_MANAGER';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'hr.user'    AND r.name = 'ROLE_HR';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'employee1'  AND r.name = 'ROLE_EMPLOYEE';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'employee2'  AND r.name = 'ROLE_EMPLOYEE';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'sales.lead' AND r.name = 'ROLE_MANAGER';
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.username = 'it.support' AND r.name = 'ROLE_EMPLOYEE';

-- 6. EMPLOYEES
INSERT IGNORE INTO employees (id, employee_code, first_name, last_name, email, phone, gender, date_of_birth, nationality, national_id, tax_id, hire_date, status, contract_type, department_id, position_id, user_id, reporting_manager_id, annual_leave_balance, sick_leave_balance, created_at, updated_at, is_deleted, version)
VALUES
(1, 'EMS-2020-001', 'Admin', 'System', 'aex31625@gmail.com', '0901234567', 'MALE',   '1985-01-01', 'Vietnam', '123456789012', '1234567890', '2020-01-01', 'ACTIVE', 'FULL_TIME', 1, 1, 1, NULL, 15, 10, NOW(), NOW(), FALSE, 0),
(2, 'EMS-2021-002', 'Nguyễn', 'Văn Quản Lý', 'manager1@ems.company.com', '0912345678', 'MALE',   '1988-05-20', 'Vietnam', '012345678901', '0123456789', '2021-06-01', 'ACTIVE', 'FULL_TIME', 2, 2, 2, 1,    12, 10, NOW(), NOW(), FALSE, 0),
(3, 'EMS-2020-003', 'Trần', 'Thị Nhân Sự', 'hr@ems.company.com', '0923456789', 'FEMALE', '1990-10-15', 'Vietnam', '987654321098', '9876543210', '2020-05-15', 'ACTIVE', 'FULL_TIME', 1, 1, 3, 1,    14, 10, NOW(), NOW(), FALSE, 0),
(4, 'EMS-2022-004', 'Lê', 'Hoàng Dev', 'employee1@ems.company.com', '0934567890', 'MALE',   '1995-03-25', 'Vietnam', '112233445566', '1122334455', '2022-03-15', 'ACTIVE', 'FULL_TIME', 2, 3, 4, 2,    12, 5,  NOW(), NOW(), FALSE, 0),
(5, 'EMS-2023-005', 'Phạm', 'Minh Dev', 'employee2@ems.company.com', '0945678901', 'MALE',   '1998-12-10', 'Vietnam', '223344556677', '2233445566', '2023-01-10', 'ACTIVE', 'FULL_TIME', 2, 4, 5, 2,    12, 5,  NOW(), NOW(), FALSE, 0),
(6, 'EMS-2022-006', 'Hoàng', 'Thị Sales', 'sales@ems.company.com', '0956789012', 'FEMALE', '1994-08-01', 'Vietnam', '334455667788', '3344556677', '2022-08-01', 'ACTIVE', 'FULL_TIME', 4, 5, 6, 1,    11, 8,  NOW(), NOW(), FALSE, 0),
(7, 'EMS-2024-007', 'Vũ', 'Trọng IT', 'it.sup@ems.company.com', '0967890123', 'MALE',   '2000-02-15', 'Vietnam', '445566778899', '4455667788', '2024-02-01', 'ACTIVE', 'FULL_TIME', 6, 8, 7, 1,    10, 10, NOW(), NOW(), FALSE, 0);

-- Update Head of Department
UPDATE departments SET head_of_department_id = 3 WHERE code = 'HR';
UPDATE departments SET head_of_department_id = 2 WHERE code = 'ENG';
UPDATE departments SET head_of_department_id = 6 WHERE code = 'SAL';

-- 7. ASSETS
-- NOTE: 'location' column omitted here intentionally — it is added (if missing) and
-- backfilled in V104__add_location_to_assets.sql to support both old and new DB schemas.
INSERT IGNORE INTO assets (id, asset_code, asset_name, asset_type, description, status, asset_condition, assigned_to_id, assigned_date, warranty_until, created_at, updated_at)
VALUES
(1, 'AST-2026-0001', 'Macbook Pro M3 14"', 'IT_EQUIPMENT', 'Laptop phát cho Dev Senior', 'ASSIGNED', 'NEW', 4, '2026-03-01', '2027-03-01', NOW(), NOW()),
(2, 'AST-2026-0002', 'Dell XPS 15 2024',  'IT_EQUIPMENT', 'Laptop cho Design team',    'ASSIGNED', 'NEW', 5, '2026-03-01', '2027-03-01', NOW(), NOW()),
(3, 'AST-2026-0003', 'Herman Miller Chair', 'FURNITURE',    'Ghế công thái học',       'AVAILABLE', 'GOOD', NULL, NULL, '2028-01-01', NOW(), NOW()),
(4, 'AST-2026-0004', 'Monitor LG 27" 4K',   'IT_EQUIPMENT', 'Màn hình mở rộng',        'ASSIGNED', 'NEW', 4, '2026-03-02', '2027-03-02', NOW(), NOW());

-- 8. ASSET INCIDENT REPORTS
INSERT IGNORE INTO asset_incident_reports (report_code, asset_id, incident_type, description, status, reported_by, reported_at, created_at)
VALUES
('INC-2026-001', 1, 'HARDWARE_ISSUE', 'Màn hình bị sọc nhẹ sau khi sử dụng 1 tuần', 'PENDING', 4, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- 9. LEAVES
INSERT IGNORE INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, is_half_day, is_paid, is_emergency, created_at, updated_at, version)
VALUES
(4, 'ANNUAL', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), 2, 'Gia đình có việc riêng', 'PENDING', FALSE, TRUE, FALSE, NOW(), NOW(), 0),
(5, 'SICK', DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), 1, 'Nghỉ ốm (nhức đầu)', 'APPROVED', FALSE, TRUE, FALSE, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), 0);

-- 10. ATTENDANCES (Past 3 days for employee 4 and 5)
-- Yesterday
INSERT IGNORE INTO attendances (employee_id, date, check_in_time, check_out_time, status, work_hours, is_late, is_remote, created_at, updated_at)
VALUES
(4, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), ' 08:30:00')), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), ' 17:35:00')), 
    'PRESENT', 485, FALSE, FALSE, NOW(), NOW()),
(5, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), ' 09:15:00')), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), ' 18:05:00')), 
    'PRESENT', 470, TRUE, FALSE, NOW(), NOW());

-- Day before yesterday
INSERT IGNORE INTO attendances (employee_id, date, check_in_time, check_out_time, status, work_hours, is_late, is_remote, created_at, updated_at)
VALUES
(4, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), ' 08:45:00')), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), ' 17:30:00')), 
    'PRESENT', 465, FALSE, FALSE, NOW(), NOW()),
(5, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), ' 08:55:00')), 
    TIMESTAMP(CONCAT(DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), ' 17:45:00')), 
    'PRESENT', 470, FALSE, FALSE, NOW(), NOW());

-- 11. WORKFLOW TEMPLATES (Seeding only if needed, V12 already handled manual adjustment)
-- Let's add a LEAVE_APPROVAL template if it's missing (placeholder was V13)
INSERT IGNORE INTO workflow_templates (name, workflow_type, description, is_active, is_deleted, created_at, updated_at, version)
VALUES
('Multi-level Leave Approval', 'LEAVE_REQUEST', 'Quy trình duyệt nghỉ phép 2 cấp: Manager và HR', TRUE, FALSE, NOW(), NOW(), 0);

SET @template_id = (SELECT id FROM workflow_templates WHERE workflow_type = 'LEAVE_REQUEST' AND is_active = TRUE LIMIT 1);
INSERT IGNORE INTO workflow_levels (template_id, level_number, assignee_type, assignee_role, created_at, updated_at, version)
VALUES
(@template_id, 1, 'ROLE', 'ROLE_MANAGER', NOW(), NOW(), 0),
(@template_id, 2, 'ROLE', 'ROLE_HR',      NOW(), NOW(), 0);