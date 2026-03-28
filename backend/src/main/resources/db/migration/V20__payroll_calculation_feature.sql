ALTER TABLE payrolls
    ADD COLUMN IF NOT EXISTS gross_salary      DECIMAL(15, 2)  DEFAULT 0    COMMENT 'Tổng thu nhập gộp trước khấu trừ',
    ADD COLUMN IF NOT EXISTS bhxh_deduction    DECIMAL(15, 2)  DEFAULT 0    COMMENT 'Khấu trừ BHXH (8%)',
    ADD COLUMN IF NOT EXISTS bhyt_deduction    DECIMAL(15, 2)  DEFAULT 0    COMMENT 'Khấu trừ BHYT (1.5%)',
    ADD COLUMN IF NOT EXISTS bhtn_deduction    DECIMAL(15, 2)  DEFAULT 0    COMMENT 'Khấu trừ BHTN (1%)',
    ADD COLUMN IF NOT EXISTS taxable_income    DECIMAL(15, 2)              COMMENT 'Thu nhập tính thuế sau khấu trừ BH và gia cảnh',
    ADD COLUMN IF NOT EXISTS pit_tax           DECIMAL(15, 2)  DEFAULT 0    COMMENT 'Thuế TNCN theo biểu lũy tiến',
    ADD COLUMN IF NOT EXISTS period            VARCHAR(7)                   COMMENT 'Kỳ lương dạng yyyy-MM, ví dụ 2026-03';

-- Populate period for existing rows (best-effort backfill)
UPDATE payrolls
SET period = CONCAT(payrollYear, '-', LPAD(payrollMonth, 2, '0'))
WHERE period IS NULL;

CREATE TABLE IF NOT EXISTS payroll_items (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    payroll_id       BIGINT       NOT NULL,
    component_code   VARCHAR(50)  NOT NULL COMMENT 'Code snapshot at calculation time',
    component_name   VARCHAR(255) NOT NULL COMMENT 'Name snapshot at calculation time',
    component_type   VARCHAR(30)  NOT NULL COMMENT 'SalaryComponentType enum value',
    nature           VARCHAR(20)  NOT NULL COMMENT 'INCOME or DEDUCTION',
    rate_percent     DECIMAL(7,4)          COMMENT 'Rate snapshot (null for fixed-amount items)',
    computed_amount  DECIMAL(15,2) NOT NULL COMMENT 'Actual VND amount for this line',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_payroll_items_payroll
        FOREIGN KEY (payroll_id)
        REFERENCES payrolls(id)
        ON DELETE CASCADE,

    INDEX idx_payroll_items_payroll_id (payroll_id),
    INDEX idx_payroll_items_type       (component_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable snapshot of salary line items per payroll record';

-- Verify the index exists on audit_logs for fast lookup by period
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_created
    ON audit_logs (entity_type, created_at);
