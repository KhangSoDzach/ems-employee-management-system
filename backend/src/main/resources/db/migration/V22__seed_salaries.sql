INSERT INTO salaries (
    employee_id, basic_salary, allowances, deductions, net_salary,
    effective_from, effective_to, currency, change_reason,
    created_at, updated_at, is_deleted
)
SELECT
    latest.employee_id,
    latest.basic_salary,
    COALESCE(latest.allowances, 0),
    COALESCE(latest.insurance_deduction, 0),
    COALESCE(latest.net_pay, latest.basic_salary),
    '2024-01-01', NULL, 'VND', 'Khởi tạo từ lịch sử payroll',
    NOW(), NOW(), 0
FROM (
         SELECT p.*
         FROM payrolls p
                  INNER JOIN (
             SELECT employee_id, MAX(payroll_year * 100 + payroll_month) AS max_ym
             FROM payrolls GROUP BY employee_id
         ) t ON p.employee_id = t.employee_id
             AND (p.payroll_year * 100 + p.payroll_month) = t.max_ym
     ) latest
WHERE latest.employee_id IN (SELECT id FROM employees WHERE status = 'ACTIVE')
  AND latest.employee_id NOT IN (
    SELECT employee_id FROM salaries
    WHERE is_deleted = 0 AND effective_from <= CURDATE()
      AND (effective_to IS NULL OR effective_to >= CURDATE())
);

-- Phương án 2: fallback 20M cho nhân viên chưa có payroll nào
INSERT INTO salaries (
    employee_id, basic_salary, allowances, deductions, net_salary,
    effective_from, effective_to, currency, change_reason,
    created_at, updated_at, is_deleted
)
SELECT e.id, 20000000, 0, 0, 20000000,
       '2024-01-01', NULL, 'VND', 'Luong mac dinh - can cap nhat',
       NOW(), NOW(), 0
FROM employees e
WHERE e.status = 'ACTIVE'
  AND e.id NOT IN (
    SELECT employee_id FROM salaries
    WHERE is_deleted = 0 AND effective_from <= CURDATE()
      AND (effective_to IS NULL OR effective_to >= CURDATE())
);

-- ─────────────────────────────────────────────────────────────
-- PART 2: Permissions
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO permissions (name, description, created_at, updated_at, is_deleted) VALUES
  ('ASSET_MANAGE',                  'Quan ly su co tai san',      NOW(), NOW(), 0),
  ('AUDIT_LOG_VIEW',                'Xem nhat ky kiem toan',      NOW(), NOW(), 0),
  ('EMPLOYEE_VIEW',                 'Xem danh sach nhan vien',    NOW(), NOW(), 0),
  ('EMPLOYEE_CREATE',               'Tao nhan vien',              NOW(), NOW(), 0),
  ('EMPLOYEE_UPDATE',               'Cap nhat nhan vien',         NOW(), NOW(), 0),
  ('EMPLOYEE_DELETE',               'Xoa nhan vien',              NOW(), NOW(), 0),
  ('EMPLOYEE_EXPORT',               'Xuat danh sach nhan vien',   NOW(), NOW(), 0),
  ('EMPLOYEE_IMPORT',               'Nhap danh sach nhan vien',   NOW(), NOW(), 0),
  ('LEAVE_APPROVE',                 'Duyet don nghi phep',        NOW(), NOW(), 0),
  ('LEAVE_VIEW',                    'Xem don nghi phep',          NOW(), NOW(), 0),
  ('ATTENDANCE_ADJUSTMENT_APPROVE', 'Duyet dieu chinh cham cong', NOW(), NOW(), 0),
  ('ATTENDANCE_CHECKIN',            'Cham cong',                  NOW(), NOW(), 0),
  ('ATTENDANCE_READ',               'Xem du lieu cham cong',      NOW(), NOW(), 0);

-- HR permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'HR' AND p.name IN (
                                   'ASSET_MANAGE','AUDIT_LOG_VIEW','EMPLOYEE_VIEW','EMPLOYEE_CREATE',
                                   'EMPLOYEE_UPDATE','EMPLOYEE_DELETE','EMPLOYEE_EXPORT','EMPLOYEE_IMPORT',
                                   'LEAVE_APPROVE','LEAVE_VIEW','ATTENDANCE_ADJUSTMENT_APPROVE',
                                   'ATTENDANCE_CHECKIN','ATTENDANCE_READ'
    );

-- MANAGER permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'MANAGER' AND p.name IN (
                                        'ASSET_MANAGE','AUDIT_LOG_VIEW','EMPLOYEE_VIEW',
                                        'LEAVE_APPROVE','LEAVE_VIEW','ATTENDANCE_ADJUSTMENT_APPROVE',
                                        'ATTENDANCE_CHECKIN','ATTENDANCE_READ'
    );
