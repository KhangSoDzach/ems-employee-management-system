-- ============================================================
-- Migration V3: Performance indexes for Payroll Access feature
-- ============================================================

-- ── Covering index for HR period view ─────────────────────────
-- Enables index-only scan when listing payrolls by period.
-- Avoids full table scan on large payrolls table.
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_period_status'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_payroll_period_status ON payrolls (payroll_year, payroll_month, status)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── Partial covering index for streaming CSV export ───────────
-- Includes net_pay + basic_salary to reduce heap fetches.
-- The JOIN FETCH to employees still uses the employee FK index.
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_period_net'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_payroll_period_net ON payrolls (payroll_year, payroll_month, employee_id, net_pay, basic_salary)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── Composite index for employee own history ──────────────────
-- (employee_id, year DESC, month DESC) matches ORDER BY in repository
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_emp_year_month'
);
SET @sql := IF(
    @idx_exists = 0,
    'CREATE INDEX idx_payroll_emp_year_month ON payrolls (employee_id, payroll_year DESC, payroll_month DESC, is_deleted)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── PayrollItem lookup index ──────────────────────────────────
-- Used in GetMyPayrollHistoryUseCase when loading items per payroll.
-- Already created in V2 as idx_payroll_items_payroll_id — verify:
-- SHOW INDEX FROM payroll_items;

-- ── Verify indexes ────────────────────────────────────────────
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('payrolls', 'payroll_items')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
