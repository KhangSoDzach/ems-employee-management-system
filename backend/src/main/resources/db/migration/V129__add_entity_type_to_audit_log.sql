-- ═══════════════════════════════════════════════════════════════════
-- V129: Add missing entity_type column to audit_log table
--
-- The audit_log table may have been created without the entity_type
-- column if V10 was skipped or the table was created via ddl-auto
-- before the column was added. This migration ensures the column
-- exists so that AuditLog entity inserts do not fail.
-- ═══════════════════════════════════════════════════════════════════

-- Add entity_type column if it doesn't already exist
ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100) NULL
    COMMENT 'Domain category of the audited operation, e.g. AUTHENTICATION';

-- Ensure legacy columns from older/conflicting schemas are NULLABLE if they exist 
-- so they don't block new AuditLog entity inserts (which don't know about these fields).
-- Note: MySQL 8.0 doesn't support IF EXISTS for MODIFY, but MariaDB 10.4+ does only in limited forms.
-- We use a simple MODIFY here; for a more generic fix, V131 will handle existing "dirty" schemas.
ALTER TABLE audit_log 
    MODIFY COLUMN IF EXISTS event_type VARCHAR(100) NULL,
    MODIFY COLUMN IF EXISTS actor_id VARCHAR(255) NULL,
    MODIFY COLUMN IF EXISTS resource_type VARCHAR(100) NULL;

-- Create the index if missing
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log (entity_type);
