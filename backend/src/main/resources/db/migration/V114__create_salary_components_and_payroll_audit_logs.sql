-- salary_components (new table)
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

SET @db = DATABASE();

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='salary_components' AND index_name='idx_salary_components_status');
SET @s = IF(@x=0,'CREATE INDEX idx_salary_components_status ON salary_components (status)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='salary_components' AND index_name='idx_salary_components_type');
SET @s = IF(@x=0,'CREATE INDEX idx_salary_components_type ON salary_components (type)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='salary_components' AND index_name='idx_salary_components_is_deleted');
SET @s = IF(@x=0,'CREATE INDEX idx_salary_components_is_deleted ON salary_components (is_deleted)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- audit_logs: may already exist from an older migration with different schema
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

-- Add ALL missing columns safely (existing table may have different schema)
SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='entity_type');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(100) NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='entity_id');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN entity_id BIGINT NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='action_type');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN action_type VARCHAR(30) NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='actor');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN actor VARCHAR(255) NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='old_value');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN old_value TEXT NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='new_value');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN new_value TEXT NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='audit_logs' AND column_name='created_at');
SET @s = IF(@x=0,'ALTER TABLE audit_logs ADD COLUMN created_at DATETIME(6) NULL','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

-- indexes for audit_logs (skip if already exist)
SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='audit_logs' AND index_name='idx_audit_logs_entity_type');
SET @s = IF(@x=0,'CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='audit_logs' AND index_name='idx_audit_logs_action_type');
SET @s = IF(@x=0,'CREATE INDEX idx_audit_logs_action_type ON audit_logs (action_type)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='audit_logs' AND index_name='idx_audit_logs_actor');
SET @s = IF(@x=0,'CREATE INDEX idx_audit_logs_actor ON audit_logs (actor)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;

SET @x = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='audit_logs' AND index_name='idx_audit_logs_created_at');
SET @s = IF(@x=0,'CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)','SELECT 1');
PREPARE p FROM @s; EXECUTE p; DEALLOCATE PREPARE p;