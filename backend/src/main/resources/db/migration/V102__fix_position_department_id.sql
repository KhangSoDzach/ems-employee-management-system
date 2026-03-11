-- ============================================================
-- Migration V102: Fix NULL department_id on positions from V7
--                 and add missing positions for Engineering
-- Root cause: V7 created positions without department_id column.
--             V99 tried INSERT IGNORE → skipped (IDs existed).
--             Result: positions 1-4 have department_id = NULL.
-- ============================================================

-- Fix existing positions that have NULL department_id
UPDATE positions SET department_id = 1, updated_at = NOW() WHERE code = 'HR-MGR'  AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 2, updated_at = NOW() WHERE code = 'ENG-MGR' AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 2, updated_at = NOW() WHERE code IN ('SWE', 'SWE-SR', 'SWE-JR') AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 3, updated_at = NOW() WHERE code IN ('FIN-MGR', 'FIN-ACC') AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 4, updated_at = NOW() WHERE code IN ('SAL-MGR', 'SAL-EXC') AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 5, updated_at = NOW() WHERE code IN ('SOC-MED', 'MAR-MGR', 'MAR-DES') AND (department_id IS NULL OR department_id = 0);
UPDATE positions SET department_id = 6, updated_at = NOW() WHERE code IN ('IT-SUP', 'IT-MGR', 'IT-DEV') AND (department_id IS NULL OR department_id = 0);

-- Thêm vị trí còn thiếu cho Engineering (nếu chưa có)
INSERT IGNORE INTO positions (code, title, description, level, is_active, department_id, created_at, updated_at, is_deleted, version)
VALUES
('ENG-SR',  'Kỹ sư Senior',           'Senior Engineer',        2, TRUE, 2, NOW(), NOW(), FALSE, 0),
('ENG-JR',  'Kỹ sư Junior',           'Junior Engineer',        1, TRUE, 2, NOW(), NOW(), FALSE, 0),
('QA-ENG',  'Kỹ sư Kiểm thử',        'QA/Test Engineer',       1, TRUE, 2, NOW(), NOW(), FALSE, 0),
('BA-ENG',  'Phân tích Nghiệp vụ',    'Business Analyst',       2, TRUE, 2, NOW(), NOW(), FALSE, 0);
