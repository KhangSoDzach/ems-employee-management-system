-- V129: Ensure audit_log.action_type exists for auth audit queries.
-- Keep this migration idempotent to support databases that already contain
-- the column/index (or partially applied historical states).

SET @audit_log_table_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
);

SET @audit_log_has_action_type := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND column_name = 'action_type'
);

SET @add_action_type_sql := IF(
    @audit_log_table_exists = 1 AND @audit_log_has_action_type = 0,
    'ALTER TABLE audit_log ADD COLUMN action_type VARCHAR(50) NOT NULL COMMENT ''LOGIN_SUCCESS | LOGIN_FAILED | TOKEN_REFRESH_SUCCESS | TOKEN_REFRESH_FAILED | LOGOUT | TOKEN_REVOKED'' AFTER entity_id',
    'SELECT 1'
);

PREPARE stmt_add_action_type FROM @add_action_type_sql;
EXECUTE stmt_add_action_type;
DEALLOCATE PREPARE stmt_add_action_type;

SET @audit_log_has_action_type_index := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'audit_log'
      AND index_name = 'idx_audit_log_action_type'
);

SET @create_action_type_index_sql := IF(
    @audit_log_table_exists = 1 AND @audit_log_has_action_type_index = 0,
    'CREATE INDEX idx_audit_log_action_type ON audit_log (action_type)',
    'SELECT 1'
);

PREPARE stmt_create_action_type_index FROM @create_action_type_index_sql;
EXECUTE stmt_create_action_type_index;
DEALLOCATE PREPARE stmt_create_action_type_index;
