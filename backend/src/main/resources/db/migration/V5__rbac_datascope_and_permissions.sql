CREATE TABLE IF NOT EXISTS role_data_scopes (
    role_id  BIGINT      NOT NULL,
    data_scope VARCHAR(20) NOT NULL,
    CONSTRAINT fk_rds_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, data_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee module permissions
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('EMPLOYEE_VIEW',   'Xem thông tin nhân viên',       'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_IMPORT', 'Import danh sách nhân viên',    'EMPLOYEE', NOW(), NOW(), FALSE, 0),
('EMPLOYEE_EXPORT', 'Export danh sách nhân viên',    'EMPLOYEE', NOW(), NOW(), FALSE, 0);

-- Leave module permissions
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('LEAVE_VIEW',   'Xem danh sách nghỉ phép',          'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_CREATE', 'Tạo yêu cầu nghỉ phép',           'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_CANCEL', 'Hủy yêu cầu nghỉ phép',           'LEAVE', NOW(), NOW(), FALSE, 0),
('LEAVE_MANAGE', 'Quản lý toàn bộ nghỉ phép',        'LEAVE', NOW(), NOW(), FALSE, 0);


-- Attendance module permissions
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('ATTENDANCE_VIEW',   'Xem chấm công',               'ATTENDANCE', NOW(), NOW(), FALSE, 0),
('ATTENDANCE_MANAGE', 'Quản lý chấm công',           'ATTENDANCE', NOW(), NOW(), FALSE, 0);

-- User management permissions
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('USER_VIEW',   'Xem thông tin tài khoản',           'USER', NOW(), NOW(), FALSE, 0),
('USER_MANAGE', 'Quản lý tài khoản người dùng',      'USER', NOW(), NOW(), FALSE, 0),
('ROLE_MANAGE', 'Quản lý vai trò và quyền',          'USER', NOW(), NOW(), FALSE, 0);

-- Gán tất cả permissions mới cho ROLE_ADMIN
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_HR')
AND p.name IN (
    'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
    'EMPLOYEE_IMPORT', 'EMPLOYEE_EXPORT',
    'LEAVE_VIEW', 'LEAVE_CREATE', 'LEAVE_APPROVE', 'LEAVE_CANCEL', 'LEAVE_MANAGE',
    'ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE',
    'USER_VIEW', 'USER_MANAGE', 'ROLE_MANAGE'
);

-- ═══ ROLE_MANAGER: Quyền quản lý team ════════════════════════
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_MANAGER'
AND p.name IN (
    'EMPLOYEE_VIEW', 'EMPLOYEE_UPDATE', 'EMPLOYEE_EXPORT',
    'LEAVE_VIEW', 'LEAVE_CREATE', 'LEAVE_APPROVE', 'LEAVE_CANCEL',
    'ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE'
);

-- ═══ ROLE_EMPLOYEE: Quyền cơ bản (SELF scope) ════════════════
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_EMPLOYEE'
AND p.name IN (
    'EMPLOYEE_VIEW', 'EMPLOYEE_UPDATE',
    'LEAVE_VIEW', 'LEAVE_CREATE', 'LEAVE_CANCEL',
    'ATTENDANCE_VIEW'
);


-- Xóa data scope cũ nếu có (idempotent - chạy lại an toàn)
DELETE FROM role_data_scopes
WHERE role_id IN (SELECT id FROM roles WHERE name IN ('ROLE_ADMIN','ROLE_HR','ROLE_MANAGER','ROLE_EMPLOYEE'));

-- ROLE_ADMIN và ROLE_HR: ALL scope
INSERT INTO role_data_scopes (role_id, data_scope)
SELECT id, 'ALL' FROM roles WHERE name IN ('ROLE_ADMIN', 'ROLE_HR');

-- ROLE_MANAGER: SELF + TEAM
INSERT INTO role_data_scopes (role_id, data_scope)
SELECT id, 'SELF' FROM roles WHERE name = 'ROLE_MANAGER';

INSERT INTO role_data_scopes (role_id, data_scope)
SELECT id, 'TEAM' FROM roles WHERE name = 'ROLE_MANAGER';

-- ROLE_EMPLOYEE: SELF only
INSERT INTO role_data_scopes (role_id, data_scope)
SELECT id, 'SELF' FROM roles WHERE name = 'ROLE_EMPLOYEE';

-- ─────────────────────────────────────────────────────────────
-- Verification (comment out sau khi verify xong)
-- ─────────────────────────────────────────────────────────────
-- SELECT r.name as role, ds.data_scope
-- FROM roles r JOIN role_data_scopes ds ON r.id = ds.role_id
-- ORDER BY r.name;
--
-- SELECT r.name as role, p.name as permission
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON p.id = rp.permission_id
-- WHERE p.name IN ('EMPLOYEE_VIEW','LEAVE_VIEW','LEAVE_APPROVE')
-- ORDER BY r.name, p.name;
