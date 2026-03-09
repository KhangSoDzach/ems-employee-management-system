-- ============================================================
-- Migration: Add Asset module permissions
-- ============================================================

-- Asset module permissions
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('ASSET_VIEW',   'Xem danh sách/chi tiết tài sản theo scope', 'ASSET', NOW(), NOW(), FALSE, 0),
('ASSET_MANAGE', 'Tạo/Cập nhật/Cấp phát/Thu hồi/Xuất lịch sử tài sản', 'ASSET', NOW(), NOW(), FALSE, 0),
('ASSET_DELETE', 'Xóa (soft delete) tài sản', 'ASSET', NOW(), NOW(), FALSE, 0);

-- ROLE_ADMIN + ROLE_HR: view + manage
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_HR')
  AND p.name IN ('ASSET_VIEW', 'ASSET_MANAGE');

-- ROLE_MANAGER + ROLE_EMPLOYEE: view only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('ROLE_MANAGER', 'ROLE_EMPLOYEE')
  AND p.name IN ('ASSET_VIEW');

-- ROLE_ADMIN: delete only for admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN'
  AND p.name IN ('ASSET_DELETE');

