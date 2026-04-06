-- ============================================================
-- Migration V23: Performance indexes for Payroll Access feature
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS add_payroll_indexes$$
CREATE PROCEDURE add_payroll_indexes()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payrolls' AND index_name = 'idx_payroll_period_status') THEN
        CREATE INDEX idx_payroll_period_status ON payrolls (payroll_year, payroll_month, status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payrolls' AND index_name = 'idx_payroll_period_net') THEN
        CREATE INDEX idx_payroll_period_net ON payrolls (payroll_year, payroll_month, employee_id, net_pay, basic_salary);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'payrolls' AND index_name = 'idx_payroll_emp_year_month') THEN
        CREATE INDEX idx_payroll_emp_year_month ON payrolls (employee_id, payroll_year DESC, payroll_month DESC, is_deleted);
    END IF;
END$$

DELIMITER ;
CALL add_payroll_indexes();
DROP PROCEDURE IF EXISTS add_payroll_indexes;
