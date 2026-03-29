-- V129: Fix missing action_type column in audit_log table
-- This addresses the 500 Internal Server Error during login where AuditLogService fails
-- because 'action_type' does not exist in the 'audit_log' table.

ALTER TABLE audit_log ADD COLUMN action_type VARCHAR(50) NOT NULL COMMENT 'LOGIN_SUCCESS | LOGIN_FAILED | TOKEN_REFRESH_SUCCESS | TOKEN_REFRESH_FAILED | LOGOUT | TOKEN_REVOKED' AFTER entity_id;

-- Ensure index exists as well
CREATE INDEX idx_audit_log_action_type ON audit_log (action_type);
