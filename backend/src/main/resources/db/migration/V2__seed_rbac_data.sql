-- =====================================
-- V2: Seed RBAC Data
-- Description: Initialize permissions, roles, and admin user
-- Author: EMS Backend Team
-- Date: 2026-02-03
-- =====================================

-- Step 1: Insert Permissions
-- Core permissions organized by category
INSERT INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
-- User Management Permissions
('USER_READ', 'View user information and list users', 'USER', NOW(), NOW(), FALSE, 0),
('USER_CREATE', 'Create new users', 'USER', NOW(), NOW(), FALSE, 0),
('USER_UPDATE', 'Update existing user information', 'USER', NOW(), NOW(), FALSE, 0),
('USER_DELETE', 'Delete users (soft delete)', 'USER', NOW(), NOW(), FALSE, 0),

-- Employee Management Permissions
('EMPLOYEE_READ', 'View employee information and list employees', 'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_CREATE', 'Create new employee records', 'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_UPDATE', 'Update existing employee information', 'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_DELETE', 'Delete employee records', 'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_IMPORT', 'Import danh sách nhân viên',   'EMPLOYEE', NOW(), NOW(), FALSE, 0),
( 'EMPLOYEE_EXPORT', 'Export danh sách nhân viên',   'EMPLOYEE', NOW(), NOW(), FALSE, 0),

-- Department Management Permissions
('DEPARTMENT_READ', 'View department information', 'DEPARTMENT', NOW(), NOW(), FALSE, 0),
('DEPARTMENT_WRITE', 'Create/Update department information', 'DEPARTMENT', NOW(), NOW(), FALSE, 0),

-- Attendance Management Permissions
('ATTENDANCE_READ', 'View attendance records', 'ATTENDANCE', NOW(), NOW(), FALSE, 0),
('ATTENDANCE_WRITE', 'Create/Update attendance records', 'ATTENDANCE', NOW(), NOW(), FALSE, 0),

-- Leave Management Permissions
('LEAVE_READ', 'View leave requests', 'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_WRITE', 'Create/Update leave requests', 'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_APPROVE', 'Approve or reject leave requests', 'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_CANCEL',  'Hủy yêu cầu nghỉ phép', 'LEAVE', NOW(), NOW(), FALSE, 0),


-- Report Permissions
('REPORT_VIEW', 'View system reports and analytics', 'REPORT', NOW(), NOW(), FALSE, 0),
('REPORT_EXPORT', 'Export reports to various formats', 'REPORT', NOW(), NOW(), FALSE, 0),

-- System Administration Permissions
('SYSTEM_CONFIG', 'Configure system settings', 'SYSTEM', NOW(), NOW(), FALSE, 0),
('AUDIT_LOG_VIEW', 'View audit logs', 'SYSTEM', NOW(), NOW(), FALSE, 0);

-- Step 2: Insert Roles
-- Define organizational roles
INSERT INTO roles (name, description, created_at, updated_at, is_deleted, version) VALUES
('ROLE_ADMIN', 'System Administrator with full access', NOW(), NOW(), FALSE, 0),
('ROLE_MANAGER', 'Department Manager with employee management capabilities', NOW(), NOW(), FALSE, 0),
('ROLE_EMPLOYEE', 'Standard employee with limited access', NOW(), NOW(), FALSE, 0),
('ROLE_HR', 'HR personnel with employee and leave management', NOW(), NOW(), FALSE, 0);

-- Step 3: Assign Permissions to Roles
-- ROLE_ADMIN: Full access to all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN';

-- ROLE_MANAGER: Employee, Department, Attendance, Leave management + Reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_MANAGER'
AND p.name IN (
    'EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE',
    'DEPARTMENT_READ', 'DEPARTMENT_WRITE',
    'ATTENDANCE_READ', 'ATTENDANCE_WRITE',
    'LEAVE_READ', 'LEAVE_WRITE', 'LEAVE_APPROVE',
    'REPORT_VIEW', 'REPORT_EXPORT'
);

-- ROLE_EMPLOYEE: Read-only access to own data
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_EMPLOYEE'
AND p.name IN (
    'EMPLOYEE_READ',
    'ATTENDANCE_READ',
    'LEAVE_READ', 'LEAVE_WRITE'
);

-- ROLE_HR: Comprehensive employee and leave management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_HR'
AND p.name IN (
    'USER_READ', 'USER_CREATE', 'USER_UPDATE',
    'EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
    'DEPARTMENT_READ',
    'ATTENDANCE_READ', 'ATTENDANCE_WRITE',
    'LEAVE_READ', 'LEAVE_WRITE', 'LEAVE_APPROVE',
    'REPORT_VIEW', 'REPORT_EXPORT'
);

-- Step 4: Create Initial Admin User
-- Password: admin123 (BCrypt hash with strength 10)
-- IMPORTANT: Change this password immediately after first login
INSERT INTO users (
    username, 
    email, 
    password, 
    enabled, 
    account_non_expired, 
    account_non_locked, 
    credentials_non_expired,
    failed_login_attempts,
    created_at, 
    updated_at, 
    is_deleted, 
    version
) VALUES (
    'admin',
    'admin@ems.company.com',
    -- BCrypt hash of 'admin123' (rounds=10) — verified with BCryptPasswordEncoder
    '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    0,
    NOW(),
    NOW(),
    FALSE,
    0
);

-- Step 5: Assign ROLE_ADMIN to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin'
AND r.name = 'ROLE_ADMIN';

-- Verification Queries (for documentation)
-- SELECT COUNT(*) as permission_count FROM permissions;
-- SELECT COUNT(*) as role_count FROM roles;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT r.name, COUNT(rp.permission_id) as permission_count 
--   FROM roles r 
--   LEFT JOIN role_permissions rp ON r.id = rp.role_id 
--   GROUP BY r.name;
