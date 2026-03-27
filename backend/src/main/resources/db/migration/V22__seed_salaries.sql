
INSERT IGNORE INTO salaries (employee_id, amount, effective_date, created_at, updated_at, is_deleted)
SELECT
    p.employee_id,
    COALESCE(
            (SELECT MAX(p2.basic_salary)
             FROM payrolls p2
             WHERE p2.employee_id = p.employee_id
               AND p2.basic_salary > 0),
            20000000  -- fallback 20M nếu không có dữ liệu
    ) AS amount,
    CURDATE()  AS effective_date,
    NOW()      AS created_at,
    NOW()      AS updated_at,
    0          AS is_deleted
FROM (SELECT DISTINCT employee_id FROM payrolls) p
WHERE NOT EXISTS (
    SELECT 1 FROM salaries s WHERE s.employee_id = p.employee_id
);

-- ── 2. Đảm bảo permissions tồn tại ──────────────────────────
INSERT IGNORE INTO permissions (name, description, created_at, updated_at, is_deleted) VALUES
  ('ASSET_MANAGE',                  'Quản lý sự cố tài sản',           NOW(), NOW(), 0),
  ('AUDIT_LOG_VIEW',                'Xem nhật ký kiểm toán',           NOW(), NOW(), 0),
  ('EMPLOYEE_VIEW',                 'Xem danh sách nhân viên',         NOW(), NOW(), 0),
  ('EMPLOYEE_CREATE',               'Tạo nhân viên',                   NOW(), NOW(), 0),
  ('EMPLOYEE_UPDATE',               'Cập nhật nhân viên',              NOW(), NOW(), 0),
  ('EMPLOYEE_DELETE',               'Xoá nhân viên',                   NOW(), NOW(), 0),
  ('EMPLOYEE_EXPORT',               'Xuất danh sách nhân viên',        NOW(), NOW(), 0),
  ('EMPLOYEE_IMPORT',               'Nhập danh sách nhân viên',        NOW(), NOW(), 0),
  ('LEAVE_APPROVE',                 'Duyệt đơn nghỉ phép',             NOW(), NOW(), 0),
  ('LEAVE_VIEW',                    'Xem đơn nghỉ phép',               NOW(), NOW(), 0),
  ('ATTENDANCE_ADJUSTMENT_APPROVE', 'Duyệt điều chỉnh chấm công',      NOW(), NOW(), 0),
  ('ATTENDANCE_CHECKIN',            'Chấm công',                       NOW(), NOW(), 0),
  ('ATTENDANCE_READ',               'Xem dữ liệu chấm công',           NOW(), NOW(), 0);

-- ── 3. Gán permissions cho HR ────────────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         CROSS JOIN permissions p
WHERE r.name = 'HR'
  AND p.name IN (
                 'ASSET_MANAGE', 'AUDIT_LOG_VIEW',
                 'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE',
                 'EMPLOYEE_DELETE', 'EMPLOYEE_EXPORT', 'EMPLOYEE_IMPORT',
                 'LEAVE_APPROVE', 'LEAVE_VIEW',
                 'ATTENDANCE_ADJUSTMENT_APPROVE', 'ATTENDANCE_CHECKIN', 'ATTENDANCE_READ'
    );

-- ── 4. Gán permissions cho MANAGER ──────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
         CROSS JOIN permissions p
WHERE r.name = 'MANAGER'
  AND p.name IN (
                 'ASSET_MANAGE', 'AUDIT_LOG_VIEW', 'EMPLOYEE_VIEW',
                 'LEAVE_APPROVE', 'LEAVE_VIEW',
                 'ATTENDANCE_ADJUSTMENT_APPROVE', 'ATTENDANCE_CHECKIN', 'ATTENDANCE_READ'
    );
