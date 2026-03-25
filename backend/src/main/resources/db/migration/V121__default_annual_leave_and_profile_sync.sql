-- =====================================
-- FIX DIRTY DATA FIRST (CRITICAL)
-- =====================================

-- 1. Force convert toàn bộ về số hợp lệ (int nên chỉ check null/out of bounds)
UPDATE employees
SET annual_leave_balance = 12
WHERE annual_leave_balance IS NULL;

-- 2. Clamp dữ liệu (chống overflow / âm)
UPDATE employees
SET annual_leave_balance = 12
WHERE annual_leave_balance < 0 OR annual_leave_balance > 365;

-- 3. Final schema đúng
ALTER TABLE employees
MODIFY COLUMN annual_leave_balance INT NOT NULL DEFAULT 12;