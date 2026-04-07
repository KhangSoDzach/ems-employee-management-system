CREATE TABLE IF NOT EXISTS audit_log (
    id                   BIGINT AUTO_INCREMENT NOT NULL,

    -- What entity / domain
    entity_type          VARCHAR(100)  NOT NULL COMMENT 'e.g. AUTHENTICATION',

    -- Identity of the resource (user_id or sso subject)
    entity_id            VARCHAR(255)  NULL     COMMENT 'Resolved user ID / sso_subject',

    -- Action performed
    action_type          VARCHAR(50)   NOT NULL COMMENT 'LOGIN_SUCCESS | LOGIN_FAILED | TOKEN_REFRESH_SUCCESS | TOKEN_REFRESH_FAILED | LOGOUT | TOKEN_REVOKED',

    -- Who did it (resolved user_id string, or ANONYMOUS)
    actor                VARCHAR(255)  NULL     COMMENT 'Resolved actor: user_id or ANONYMOUS',

    -- Credential attempted (email / username) – useful when actor is ANONYMOUS
    identifier_attempted VARCHAR(255)  NULL     COMMENT 'Username / email that was attempted',

    -- Contextual before/after values (no passwords / tokens stored here)
    old_value            TEXT          NULL,
    new_value            TEXT          NULL     COMMENT 'JSON: login_method, result, etc.',

    -- Network & client metadata
    ip_address           VARCHAR(50)   NULL,
    user_agent           VARCHAR(1000) NULL,
    client_type          VARCHAR(20)   NULL     COMMENT 'WEB | MOBILE | API',
    correlation_id       VARCHAR(100)  NULL,

    -- Immutable timestamp
    created_at           DATETIME(6)   NOT NULL,

    CONSTRAINT pk_audit_log PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Append-only authentication audit log. Retention: 7 years.';

-- TiDB-compatible conditional index creation (no DELIMITER / stored procedure).
SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_entity_type'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_log_entity_type ON audit_log (entity_type)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_action_type'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_log_action_type ON audit_log (action_type)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_actor'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_log_actor ON audit_log (actor)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_identifier'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_log_identifier ON audit_log (identifier_attempted)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(1)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_created_at'
);
SET @idx_sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_log_created_at ON audit_log (created_at)', 'SELECT 1');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
