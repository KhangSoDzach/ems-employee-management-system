-- ============================================================
-- Migration V3: Performance indexes for Payroll Access feature
-- ============================================================

-- ── Covering index for HR period view ─────────────────────────
-- Enables index-only scan when listing payrolls by period.
-- Avoids full table scan on large payrolls table.
CREATE INDEX IF NOT EXISTS idx_payroll_period_status
    ON payrolls (payroll_year, payroll_month, status);

-- ── Partial covering index for streaming CSV export ───────────
-- Includes net_pay + basic_salary to reduce heap fetches.
-- The JOIN FETCH to employees still uses the employee FK index.
CREATE INDEX IF NOT EXISTS idx_payroll_period_net
    ON payrolls (payroll_year, payroll_month, employee_id, net_pay, basic_salary);

-- ── Composite index for employee own history ──────────────────
-- (employee_id, year DESC, month DESC) matches ORDER BY in repository
CREATE INDEX IF NOT EXISTS idx_payroll_emp_year_month
    ON payrolls (employee_id, payroll_year DESC, payroll_month DESC, is_deleted);

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
