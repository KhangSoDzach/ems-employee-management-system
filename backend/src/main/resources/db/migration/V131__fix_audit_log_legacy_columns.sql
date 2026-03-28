-- ═══════════════════════════════════════════════════════════════════
-- V131: Reconcile audit_log schema with AuditLog entity definition
--
-- Fixes "Field 'event_type' doesn't have a default value" error.
-- Legacy columns from previous audit log versions are made nullable
-- so that inserts from the current AuditLog entity (which doesn't
-- include these fields) no longer fail at the database level.
-- ═══════════════════════════════════════════════════════════════════

-- Make legacy columns nullable if they exist
ALTER TABLE audit_log
    MODIFY COLUMN event_type VARCHAR(100) NULL,
    MODIFY COLUMN actor_id VARCHAR(255) NULL,
    MODIFY COLUMN actor_name VARCHAR(255) NULL,
    MODIFY COLUMN actor_role VARCHAR(100) NULL,
    MODIFY COLUMN resource_type VARCHAR(100) NULL;

-- Ensure audit_log table matches entity requirements
ALTER TABLE audit_log
    MODIFY COLUMN entity_type VARCHAR(100) NOT NULL DEFAULT 'AUTHENTICATION';

-- Fix existing "null" entity types if any were inserted during bug period
UPDATE audit_log 
SET entity_type = 'AUTHENTICATION' 
WHERE entity_type IS NULL OR entity_type = '';
