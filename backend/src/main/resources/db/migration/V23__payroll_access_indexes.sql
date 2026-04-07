-- ============================================================
-- Migration V23: Performance indexes for Payroll Access feature
-- ============================================================

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_period_status'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_payroll_period_status ON payrolls (payroll_year, payroll_month, status)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_period_net'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_payroll_period_net ON payrolls (payroll_year, payroll_month, employee_id, net_pay, basic_salary)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND index_name = 'idx_payroll_emp_year_month'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_payroll_emp_year_month ON payrolls (employee_id, payroll_year DESC, payroll_month DESC, is_deleted)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
