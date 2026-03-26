-- ═══════════════════════════════════════════════════════════════════
-- V132: Align audit_log table with production AuditLog entity
-- Compatibility: MySQL 5.5 / MariaDB + Idempotency
-- ═══════════════════════════════════════════════════════════════════

-- 1. Infrastructure for Idempotent DDL
DROP PROCEDURE IF EXISTS ems_rename_col;
DELIMITER //
CREATE PROCEDURE ems_rename_col(IN tbl VARCHAR(64), IN old_c VARCHAR(64), IN new_c VARCHAR(64), IN def VARCHAR(255))
BEGIN
    IF EXISTS (SELECT * FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=tbl AND column_name=old_c) THEN
        SET @s = CONCAT('ALTER TABLE ', tbl, ' CHANGE COLUMN ', old_c, ' ', new_c, ' ', def);
        PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS ems_add_col;
DELIMITER //
CREATE PROCEDURE ems_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def VARCHAR(255))
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=tbl AND column_name=col) THEN
        SET @s = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', def);
        PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS ems_drop_idx;
DELIMITER //
CREATE PROCEDURE ems_drop_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64))
BEGIN
    IF EXISTS (SELECT * FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=tbl AND index_name=idx) THEN
        SET @s = CONCAT('ALTER TABLE ', tbl, ' DROP INDEX ', idx);
        PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS ems_create_idx;
DELIMITER //
CREATE PROCEDURE ems_create_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64), IN cols VARCHAR(255))
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=tbl AND index_name=idx) THEN
        SET @s = CONCAT('CREATE INDEX ', idx, ' ON ', tbl, ' (', cols, ')');
        PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- 2. Execution Phase: Audit Log
CALL ems_rename_col('audit_log', 'action_type', 'action', 'VARCHAR(100) NOT NULL');
CALL ems_rename_col('audit_log', 'entity_type', 'resource', 'VARCHAR(100) NOT NULL');
CALL ems_rename_col('audit_log', 'identifier_attempted', 'identifier', 'VARCHAR(255) NULL');

CALL ems_add_col('audit_log', 'category', 'VARCHAR(50) NOT NULL DEFAULT \'DATA_CHANGE\' AFTER resource');
CALL ems_add_col('audit_log', 'target_id', 'VARCHAR(255) NULL AFTER action');

UPDATE audit_log SET category = 'AUTHENTICATION' WHERE resource IN ('AUTH', 'AUTHENTICATION');
UPDATE audit_log SET category = 'AUTHORIZATION' WHERE action = 'ACCESS_DENIED';

CALL ems_drop_idx('audit_log', 'idx_audit_log_entity_type');
CALL ems_drop_idx('audit_log', 'idx_audit_log_action_type');
CALL ems_create_idx('audit_log', 'idx_audit_log_resource', 'resource');
CALL ems_create_idx('audit_log', 'idx_audit_log_action', 'action');
CALL ems_create_idx('audit_log', 'idx_audit_log_category', 'category');

-- 3. Execution Phase: Announcements
CALL ems_add_col('announcements', 'email_delivery_requested', 'BIT(1) NOT NULL DEFAULT b\'0\' AFTER target_audience');
CALL ems_add_col('announcements', 'emailed_recipient_count', 'INT NOT NULL DEFAULT 0 AFTER email_delivery_requested');
CALL ems_create_idx('announcements', 'idx_announcements_email_delivery_requested', 'email_delivery_requested');

-- 4. Cleanup
DROP PROCEDURE ems_rename_col;
DROP PROCEDURE ems_add_col;
DROP PROCEDURE ems_drop_idx;
DROP PROCEDURE ems_create_idx;
