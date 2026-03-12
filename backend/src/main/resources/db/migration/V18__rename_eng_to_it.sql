-- ============================================================
-- Migration V104: Rename ENG to IT
-- Description: Update the Engineering department to Information Technology
-- and update the position codes accordingly.
-- ============================================================

UPDATE departments SET code = 'IT', name = 'Information Technology' WHERE id = 2;
UPDATE positions SET code = REPLACE(code, 'ENG-', 'IT-') WHERE department_id = 2;
