-- ============================================================
-- Migration V100: Add missing positions per department
-- Description: Ensure each department has at least one position
--              so the "Add Employee" form position dropdown works.
-- Author: Antigravity AI
-- Date: 2026-03-10
-- ============================================================

-- Bổ sung vị trí cho phòng Finance (department_id = 3) - hiện đang trống
INSERT IGNORE INTO positions (id, code, title, description, level, is_active, department_id, created_at, updated_at, is_deleted, version)
VALUES
(9,  'FIN-MGR', 'Trưởng phòng Tài chính',   'Finance Manager',           3, TRUE, 3, NOW(), NOW(), FALSE, 0),
(10, 'FIN-ACC', 'Kế toán viên',              'Accountant',                1, TRUE, 3, NOW(), NOW(), FALSE, 0),

-- Bổ sung thêm vị trí HR (ngoài HR-MGR đã có)
(11, 'HR-SPE',  'Chuyên viên Nhân sự',       'HR Specialist',             1, TRUE, 1, NOW(), NOW(), FALSE, 0),
(12, 'HR-REC',  'Chuyên viên Tuyển dụng',    'HR Recruiter',              1, TRUE, 1, NOW(), NOW(), FALSE, 0),

-- Bổ sung thêm vị trí Marketing (ngoài SOC-MED đã có)
(13, 'MAR-MGR', 'Trưởng phòng Marketing',    'Marketing Manager',         3, TRUE, 5, NOW(), NOW(), FALSE, 0),
(14, 'MAR-DES', 'Thiết kế Đồ họa',           'Graphic Designer',          1, TRUE, 5, NOW(), NOW(), FALSE, 0),

-- Bổ sung thêm vị trí IT (ngoài IT-SUP đã có)
(15, 'IT-MGR',  'Trưởng phòng CNTT',         'IT Manager',                3, TRUE, 6, NOW(), NOW(), FALSE, 0),
(16, 'IT-DEV',  'Lập trình viên Hệ thống',   'System Developer',          2, TRUE, 6, NOW(), NOW(), FALSE, 0);
