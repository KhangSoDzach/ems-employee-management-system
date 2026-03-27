SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'gross_salary'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN gross_salary DECIMAL(15, 2) DEFAULT 0 COMMENT 'Tổng thu nhập gộp trước khấu trừ'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'bhxh_deduction'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN bhxh_deduction DECIMAL(15, 2) DEFAULT 0 COMMENT 'Khấu trừ BHXH (8%)'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'bhyt_deduction'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN bhyt_deduction DECIMAL(15, 2) DEFAULT 0 COMMENT 'Khấu trừ BHYT (1.5%)'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'bhtn_deduction'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN bhtn_deduction DECIMAL(15, 2) DEFAULT 0 COMMENT 'Khấu trừ BHTN (1%)'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'taxable_income'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN taxable_income DECIMAL(15, 2) COMMENT 'Thu nhập tính thuế sau khấu trừ BH và gia cảnh'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'pit_tax'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN pit_tax DECIMAL(15, 2) DEFAULT 0 COMMENT 'Thuế TNCN theo biểu lũy tiến'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payrolls'
      AND column_name = 'period'
);
SET @sql := IF(
    @col_exists = 0,
    "ALTER TABLE payrolls ADD COLUMN period VARCHAR(7) COMMENT 'Kỳ lương dạng yyyy-MM, ví dụ 2026-03'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate period for existing rows (best-effort backfill)
UPDATE payrolls
SET period = CONCAT(payroll_year, '-', LPAD(payroll_month, 2, '0'))
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
SET @table_exists := (
    SELECT COUNT(1)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
);
SET @idx_exists := (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_logs'
      AND index_name = 'idx_audit_logs_entity_type_created'
);
SET @sql := IF(
    @table_exists = 1 AND @idx_exists = 0,
    'CREATE INDEX idx_audit_logs_entity_type_created ON audit_logs (entity_type, created_at)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
