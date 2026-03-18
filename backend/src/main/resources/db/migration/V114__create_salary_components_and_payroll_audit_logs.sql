CREATE TABLE IF NOT EXISTS salary_components
(
    id           BIGINT AUTO_INCREMENT NOT NULL,
    created_at   DATETIME(6)           NOT NULL,
    updated_at   DATETIME(6)           NOT NULL,
    created_by   VARCHAR(255)          NULL,
    updated_by   VARCHAR(255)          NULL,
    version      BIGINT                NULL,
    deleted_at   DATETIME(6)           NULL,
    is_deleted   BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by   VARCHAR(255)          NULL,

    code         VARCHAR(50)           NOT NULL,
    name         VARCHAR(255)          NOT NULL,
    type         VARCHAR(30)           NOT NULL,
    is_taxable   BOOLEAN               NOT NULL,
    is_insurable BOOLEAN               NOT NULL,
    amount       DECIMAL(15, 2)        NULL,
    status       VARCHAR(20)           NOT NULL,

    CONSTRAINT pk_salary_components PRIMARY KEY (id),
    CONSTRAINT uk_salary_components_code UNIQUE (code),
    CONSTRAINT uk_salary_components_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_salary_components_status ON salary_components (status);
CREATE INDEX idx_salary_components_type ON salary_components (type);
CREATE INDEX idx_salary_components_is_deleted ON salary_components (is_deleted);

CREATE TABLE IF NOT EXISTS audit_logs
(
    id          BIGINT AUTO_INCREMENT NOT NULL,
    entity_type VARCHAR(100)          NOT NULL,
    entity_id   BIGINT                NULL,
    action_type VARCHAR(30)           NOT NULL,
    actor       VARCHAR(255)          NOT NULL,
    old_value   TEXT                  NULL,
    new_value   TEXT                  NULL,
    created_at  DATETIME(6)           NOT NULL,

    CONSTRAINT pk_audit_logs PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_action_type ON audit_logs (action_type);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
