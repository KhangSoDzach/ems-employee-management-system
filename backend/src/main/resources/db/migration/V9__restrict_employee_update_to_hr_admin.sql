-- ═══════════════════════════════════════════════════════════════════
-- V9: Restrict EMPLOYEE_UPDATE permission to ROLE_HR + ROLE_ADMIN only
--
-- Business rule (US-07 AC-04):
--   • ROLE_EMPLOYEE  → read-only (EMPLOYEE_VIEW only, no EMPLOYEE_UPDATE)
--   • ROLE_MANAGER   → view + export team (no EMPLOYEE_UPDATE)
--   • ROLE_HR        → full CRUD including EMPLOYEE_UPDATE  (unchanged)
--   • ROLE_ADMIN     → full CRUD including EMPLOYEE_UPDATE  (unchanged)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Thu hồi EMPLOYEE_UPDATE khỏi ROLE_EMPLOYEE
DELETE FROM role_permissions
WHERE role_id  = (SELECT id FROM roles WHERE name = 'ROLE_EMPLOYEE')
  AND permission_id = (SELECT id FROM permissions WHERE name = 'EMPLOYEE_UPDATE');

-- 2. Thu hồi EMPLOYEE_UPDATE khỏi ROLE_MANAGER
--    Manager chỉ được xem & export nhân viên trong team, không được cập nhật hồ sơ
DELETE FROM role_permissions
WHERE role_id  = (SELECT id FROM roles WHERE name = 'ROLE_MANAGER')
  AND permission_id = (SELECT id FROM permissions WHERE name = 'EMPLOYEE_UPDATE');

-- Verification (tuỳ chọn - bỏ comment khi cần debug)
-- SELECT r.name AS role, p.name AS permission
-- FROM roles r
-- JOIN role_permissions rp ON rp.role_id = r.id
-- JOIN permissions p ON p.id = rp.permission_id
-- WHERE p.name = 'EMPLOYEE_UPDATE'
-- ORDER BY r.name;
-- Expected result: chỉ ROLE_ADMIN và ROLE_HR còn giữ EMPLOYEE_UPDATE
