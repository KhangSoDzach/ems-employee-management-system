-- ============================================================
-- Migration V103: Reset departments & positions to 3-dept structure
-- Description: Simplify to match actual role enum:
--   ROLE_ADMIN    → Administration
--   ROLE_HR       → Human Resources (HR Specialist)
--   ROLE_MANAGER  → Engineering Manager
--   ROLE_EMPLOYEE → Junior / Senior Engineer
-- ============================================================

-- ── 1. Temporarily null-out employee position/dept FKs ──────
--    to allow safe delete of positions & departments
UPDATE employees SET position_id = NULL, department_id = NULL, updated_at = NOW() WHERE id > 0;

-- ── 2. Delete ALL existing positions and departments ────────
--    (safe now — no employees reference them)
DELETE FROM positions WHERE id > 0;
DELETE FROM departments WHERE id > 0;

-- ── 3. Re-insert the 3 canonical departments ────────────────
INSERT INTO departments (id, code, name, description, is_active, created_at, updated_at, is_deleted, version)
VALUES
  (1, 'ADMIN', 'Administration',  'Phòng Quản trị hệ thống', TRUE, NOW(), NOW(), FALSE, 0),
  (2, 'ENG',   'Engineering',     'Phòng Kỹ thuật phần mềm', TRUE, NOW(), NOW(), FALSE, 0),
  (3, 'HR',    'Human Resources', 'Phòng Nhân sự',            TRUE, NOW(), NOW(), FALSE, 0);

-- ── 4. Re-insert the canonical positions ────────────────────
--   level 1 = Employee / Junior   (ROLE_EMPLOYEE)
--   level 2 = Senior              (ROLE_EMPLOYEE senior)
--   level 3 = Manager             (ROLE_MANAGER)
--   level 4 = Admin               (ROLE_ADMIN)
INSERT INTO positions (id, code, title, description, level, is_active, department_id, created_at, updated_at, is_deleted, version)
VALUES
  -- Administration
  (1, 'ADMIN-SYS', 'System Administrator', 'Quản trị hệ thống toàn quyền', 4, TRUE, 1, NOW(), NOW(), FALSE, 0),

  -- Engineering
  (2, 'ENG-MGR',   'Engineering Manager',  'Trưởng phòng Kỹ thuật',        3, TRUE, 2, NOW(), NOW(), FALSE, 0),
  (3, 'ENG-SR',    'Senior Engineer',      'Kỹ sư phần mềm Senior',        2, TRUE, 2, NOW(), NOW(), FALSE, 0),
  (4, 'ENG-JR',    'Junior Engineer',      'Kỹ sư phần mềm Junior',        1, TRUE, 2, NOW(), NOW(), FALSE, 0),

  -- Human Resources
  (5, 'HR-STAFF',  'HR Specialist',        'Chuyên viên Nhân sự',          1, TRUE, 3, NOW(), NOW(), FALSE, 0);

-- ── 5. Re-point employees to correct dept & position ────────
--   Admin user (id=1) → Administration / System Administrator
UPDATE employees SET department_id = 1, position_id = 1, status = 'ACTIVE', updated_at = NOW() WHERE id = 1;

--   manager1 (id=2) → Engineering / Engineering Manager
UPDATE employees SET department_id = 2, position_id = 2, status = 'ACTIVE', updated_at = NOW() WHERE id = 2;

--   hr.user (id=3) → Human Resources / HR Specialist
UPDATE employees SET department_id = 3, position_id = 5, status = 'ACTIVE', updated_at = NOW() WHERE id = 3;

--   employee1 (id=4) → Engineering / Senior Engineer
UPDATE employees SET department_id = 2, position_id = 3, status = 'ACTIVE', updated_at = NOW() WHERE id = 4;

--   employee2 (id=5) → Engineering / Junior Engineer
UPDATE employees SET department_id = 2, position_id = 4, status = 'ACTIVE', updated_at = NOW() WHERE id = 5;

--   Any remaining employees with no dept → Safety fallback to Engineering/Junior
UPDATE employees SET department_id = 2, position_id = 4, updated_at = NOW()
WHERE department_id IS NULL AND id > 0;

-- ── 6. Set department heads ──────────────────────────────────
UPDATE departments SET head_of_department_id = 2 WHERE id = 2;  -- manager1 leads Engineering
UPDATE departments SET head_of_department_id = 3 WHERE id = 3;  -- hr.user leads HR

-- ── 7. Reset auto_increment sequences to avoid gaps ─────────
ALTER TABLE positions   AUTO_INCREMENT = 6;
ALTER TABLE departments AUTO_INCREMENT = 4;
