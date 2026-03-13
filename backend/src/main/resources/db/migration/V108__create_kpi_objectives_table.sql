
CREATE TABLE IF NOT EXISTS kpi_objectives (
    id              BIGINT          NOT NULL AUTO_INCREMENT,

    -- Core
    name            VARCHAR(255)    NOT NULL,
    type            VARCHAR(10)     NOT NULL    COMMENT 'KPI | OKR',
    metric_type     VARCHAR(10)     NOT NULL    COMMENT 'PERCENT | VND | NUMBER',
    target_value    DECIMAL(20, 2)  NOT NULL,
    actual_value    DECIMAL(20, 2)  NOT NULL DEFAULT 0.00,
    weight          DECIMAL(5, 2)   NOT NULL    COMMENT '0 < weight <= 100',
    description     TEXT            NULL,

    -- Scope
    scope_type      VARCHAR(15)     NOT NULL    COMMENT 'COMPANY | DEPARTMENT | EMPLOYEE',
    scope_id        BIGINT          NULL        COMMENT 'dept_id or employee_id; NULL for COMPANY',

    -- Period
    period_start    DATE            NOT NULL,
    period_end      DATE            NOT NULL,

    -- Status (INCOMPLETE | ACTIVE) — aggregate level, set via service
    status          VARCHAR(15)     NOT NULL DEFAULT 'INCOMPLETE',

    -- BaseEntity audit fields
    created_at      DATETIME(6)     NOT NULL,
    updated_at      DATETIME(6)     NOT NULL,
    created_by      VARCHAR(255)    NULL,
    updated_by      VARCHAR(255)    NULL,
    version         BIGINT          NULL,
    deleted_at      DATETIME(6)     NULL,
    is_deleted      BIT(1)          NOT NULL DEFAULT 0,
    deleted_by      VARCHAR(255)    NULL,

    PRIMARY KEY (id),
    INDEX idx_kpi_scope         (scope_type, scope_id),
    INDEX idx_kpi_period        (period_start, period_end),
    INDEX idx_kpi_type          (type),
    INDEX idx_kpi_status        (status),
    INDEX idx_kpi_is_deleted    (is_deleted)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'KPI / OKR objectives per scope & period';
