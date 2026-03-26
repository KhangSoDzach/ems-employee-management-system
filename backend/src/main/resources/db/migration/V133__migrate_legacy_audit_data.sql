-- ═══════════════════════════════════════════════════════════════════
-- V133: Migrate legacy Audit Log data and fix Employee schema
--
-- 1. Standardize Audit Actions (Prevents No enum constant errors)
-- 2. Standardize Resources
-- 3. Fix missing columns in employees table
-- ═══════════════════════════════════════════════════════════════════

-- 1. Infrastructure for Idempotent DDL (Local to this migration)
DROP PROCEDURE IF EXISTS temp_add_col;
DELIMITER //
CREATE PROCEDURE temp_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def VARCHAR(255))
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=tbl AND column_name=col) THEN
        SET @s = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', def);
        PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 2. Audit Log Data Migration
UPDATE audit_log SET action = 'LOGIN' WHERE action IN ('LOGIN_SUCCESS', 'AUTH_LOGIN_SUCCESS');
UPDATE audit_log SET action = 'LOGIN_FAILED' WHERE action IN ('AUTH_LOGIN_FAILED');
UPDATE audit_log SET action = 'LOGOUT' WHERE action IN ('AUTH_LOGOUT', 'TOKEN_REVOKED');
UPDATE audit_log SET action = 'TOKEN_REFRESH' WHERE action IN ('TOKEN_REFRESH_SUCCESS', 'AUTH_TOKEN_REFRESH_SUCCESS');
UPDATE audit_log SET action = 'TOKEN_REFRESH_FAILED' WHERE action IN ('AUTH_TOKEN_REFRESH_FAILED', 'TOKEN_EXPIRED', 'TOKEN_INVALID');
UPDATE audit_log SET action = 'TOKEN_REVOKE' WHERE action IN ('AUTH_TOKEN_REVOKED');
UPDATE audit_log SET action = 'PASSWORD_CHANGE' WHERE action IN ('PASSWORD_CHANGED', 'AUTH_PASSWORD_CHANGED');
UPDATE audit_log SET action = 'ACCESS_DENIED' WHERE action IN ('AUTH_ACCESS_DENIED');

UPDATE audit_log SET action = 'ASSET_SUBMIT' WHERE action IN ('ASSET_REPORT_SUBMITTED', 'ASSET_REQUEST_SUBMITTED');
UPDATE audit_log SET action = 'ASSET_APPROVE' WHERE action IN ('ASSET_REPORT_APPROVED', 'ASSET_REQUEST_APPROVED');
UPDATE audit_log SET action = 'ASSET_REJECT' WHERE action IN ('ASSET_REPORT_REJECTED', 'ASSET_REQUEST_REJECTED');

UPDATE audit_log SET resource = 'AUTH' WHERE resource IN ('AUTHENTICATION', 'AUTH_RESOURCE');
UPDATE audit_log SET resource = 'ASSET' WHERE resource IN ('ASSET_REQUEST', 'ASSET_INCIDENT');

-- 3. Employee Table Schema Fix
CALL temp_add_col('employees', 'contract_duration_months', 'INT NULL AFTER city');

-- 4. Cleanup
DROP PROCEDURE temp_add_col;
