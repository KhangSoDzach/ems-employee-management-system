-- =====================================
-- V11: Attendance Check-in Photo + Manual Adjustment Workflow
-- Description:
--   1. Extend attendances table (photo URLs)
--   2. Create workflow_templates + workflow_levels tables (Admin config)
--   3. Create attendance_adjustment_requests table
--   4. Create attendance_adjustment_histories table (audit trail)
--   5. Add new RBAC permissions for attendance adjustment
--   6. Seed default 1-level approval workflow (MANAGER role)
-- Author: EMS Backend Team
-- Date: 2026-03-04
-- =====================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND attendances TABLE
--    Add photo URLs for check-in / check-out camera captures
-- ─────────────────────────────────────────────────────────────
SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'attendances'
      AND column_name = 'check_in_photo_url'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE attendances ADD COLUMN check_in_photo_url VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(1)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'attendances'
      AND column_name = 'check_out_photo_url'
);
SET @col_sql = IF(@col_exists = 0, 'ALTER TABLE attendances ADD COLUMN check_out_photo_url VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─────────────────────────────────────────────────────────────
-- 2. WORKFLOW_TEMPLATES
--    Admin-configurable approval workflow definitions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_templates
(
    id            BIGINT AUTO_INCREMENT NOT NULL,
    created_at    DATETIME(6)           NOT NULL,
    updated_at    DATETIME(6)           NOT NULL,
    created_by    VARCHAR(255)          NULL,
    updated_by    VARCHAR(255)          NULL,
    version       BIGINT                NULL,
    deleted_at    DATETIME(6)           NULL,
    is_deleted    BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by    VARCHAR(255)          NULL,
    name          VARCHAR(100)          NOT NULL,
    workflow_type VARCHAR(60)           NOT NULL COMMENT 'e.g. MANUAL_ATTENDANCE_ADJUSTMENT',
    description   VARCHAR(500)          NULL,
    is_active     BOOLEAN               NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_workflow_templates PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX uc_workflow_templates_type ON workflow_templates (workflow_type, is_active, is_deleted);
CREATE INDEX idx_workflow_templates_type ON workflow_templates (workflow_type);

-- ─────────────────────────────────────────────────────────────
-- 3. WORKFLOW_LEVELS
--    Each level in a workflow template defines who approves
--    and how long before escalation occurs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_levels
(
    id                BIGINT AUTO_INCREMENT NOT NULL,
    created_at        DATETIME(6)           NOT NULL,
    updated_at        DATETIME(6)           NOT NULL,
    created_by        VARCHAR(255)          NULL,
    updated_by        VARCHAR(255)          NULL,
    version           BIGINT                NULL,
    deleted_at        DATETIME(6)           NULL,
    is_deleted        BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by        VARCHAR(255)          NULL,
    template_id       BIGINT                NOT NULL,
    level_number      INT                   NOT NULL COMMENT '1-based level order',
    assignee_type     VARCHAR(20)           NOT NULL COMMENT 'ROLE | USER',
    assignee_role     VARCHAR(60)           NULL     COMMENT 'Role name, e.g. ROLE_MANAGER',
    assignee_user_id  BIGINT                NULL     COMMENT 'Specific user assignee (optional)',
    timeout_hours     INT                   NULL     COMMENT 'Hours before escalation reminder',
    notes             VARCHAR(500)          NULL,
    CONSTRAINT pk_workflow_levels PRIMARY KEY (id),
    CONSTRAINT uq_workflow_level_number UNIQUE (template_id, level_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_workflow_levels_template ON workflow_levels (template_id);

ALTER TABLE workflow_levels
    ADD CONSTRAINT FK_WORKFLOW_LEVELS_ON_TEMPLATE
    FOREIGN KEY (template_id) REFERENCES workflow_templates (id);

ALTER TABLE workflow_levels
    ADD CONSTRAINT FK_WORKFLOW_LEVELS_ON_ASSIGNEE_USER
    FOREIGN KEY (assignee_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 4. ATTENDANCE_ADJUSTMENT_REQUESTS
--    Core table for manual attendance correction requests
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_adjustment_requests
(
    id                       BIGINT AUTO_INCREMENT NOT NULL,
    created_at               DATETIME(6)           NOT NULL,
    updated_at               DATETIME(6)           NOT NULL,
    created_by               VARCHAR(255)          NULL,
    updated_by               VARCHAR(255)          NULL,
    version                  BIGINT                NULL,
    deleted_at               DATETIME(6)           NULL,
    is_deleted               BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by               VARCHAR(255)          NULL,

    -- Core relations
    employee_id              BIGINT                NOT NULL,
    attendance_id            BIGINT                NULL  COMMENT 'Target attendance record (nullable: may not exist yet)',

    -- Requested correction values
    request_date             DATE                  NOT NULL COMMENT 'Date of attendance to fix',
    proposed_check_in_time   DATETIME(6)           NULL,
    proposed_check_out_time  DATETIME(6)           NULL,

    -- Reason
    reason_type              VARCHAR(40)           NOT NULL COMMENT 'DEVICE_ERROR | FORGOT_CHECKIN | FORGOT_CHECKOUT | SYSTEM_ERROR | OTHER',
    reason_text              VARCHAR(2000)         NOT NULL COMMENT 'Detailed reason (required)',

    -- Workflow state
    status                   VARCHAR(40)           NOT NULL DEFAULT 'PENDING_LEVEL_1'
                                                   COMMENT 'PENDING_LEVEL_1..5 | APPROVED | REJECTED | RETURNED_TO_EMPLOYEE',
    current_approval_level   INT                   NOT NULL DEFAULT 1,
    max_approval_level       INT                   NOT NULL DEFAULT 1,
    workflow_template_id     BIGINT                NULL,

    -- System-collected incident metadata
    incident_ip_address      VARCHAR(50)           NULL,
    incident_device_info     VARCHAR(255)          NULL,
    incident_user_agent      VARCHAR(500)          NULL,
    incident_geo_log         TEXT                  NULL  COMMENT 'Last known geolocation at incident time (JSON)',
    incident_photo_url       VARCHAR(500)          NULL  COMMENT 'Photo captured at incident time (if any)',

    -- Flag for manager: requires extra manual scrutiny
    requires_manual_review   BOOLEAN               NOT NULL DEFAULT FALSE
                                                   COMMENT 'True when geo/photo is missing or suspicious',

    -- Final resolution
    resolved_at              DATETIME(6)           NULL,
    resolved_by_user_id      BIGINT                NULL,

    CONSTRAINT pk_attendance_adjustment_requests PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_adj_req_employee     ON attendance_adjustment_requests (employee_id);
CREATE INDEX idx_adj_req_attendance   ON attendance_adjustment_requests (attendance_id);
CREATE INDEX idx_adj_req_status       ON attendance_adjustment_requests (status);
CREATE INDEX idx_adj_req_date         ON attendance_adjustment_requests (request_date);
CREATE INDEX idx_adj_req_level_status ON attendance_adjustment_requests (current_approval_level, status);

ALTER TABLE attendance_adjustment_requests
    ADD CONSTRAINT FK_ADJ_REQ_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE attendance_adjustment_requests
    ADD CONSTRAINT FK_ADJ_REQ_ON_ATTENDANCE
    FOREIGN KEY (attendance_id) REFERENCES attendances (id);

ALTER TABLE attendance_adjustment_requests
    ADD CONSTRAINT FK_ADJ_REQ_ON_WORKFLOW_TEMPLATE
    FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates (id);

ALTER TABLE attendance_adjustment_requests
    ADD CONSTRAINT FK_ADJ_REQ_ON_RESOLVED_BY
    FOREIGN KEY (resolved_by_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 5. ATTENDANCE_ADJUSTMENT_HISTORIES
--    Immutable audit trail for every state change in a request
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_adjustment_histories
(
    id                     BIGINT AUTO_INCREMENT NOT NULL,
    created_at             DATETIME(6)           NOT NULL,
    updated_at             DATETIME(6)           NOT NULL,
    created_by             VARCHAR(255)          NULL,
    updated_by             VARCHAR(255)          NULL,
    version                BIGINT                NULL,

    -- Relations
    adjustment_request_id  BIGINT                NOT NULL,
    action_by_user_id      BIGINT                NULL  COMMENT 'NULL for system-triggered actions',

    -- Action details
    action                 VARCHAR(40)           NOT NULL
                                                 COMMENT 'SUBMITTED | APPROVED_LEVEL_N | REJECTED | RETURNED_TO_EMPLOYEE | RESUBMITTED',
    level_acted_on         INT                   NULL  COMMENT 'Approval level at which this action occurred',
    comment                VARCHAR(2000)         NULL,
    action_at              DATETIME(6)           NOT NULL,

    -- Snapshot of status transition
    status_before          VARCHAR(40)           NULL,
    status_after           VARCHAR(40)           NOT NULL,

    CONSTRAINT pk_adj_histories PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_adj_hist_request   ON attendance_adjustment_histories (adjustment_request_id);
CREATE INDEX idx_adj_hist_action_by ON attendance_adjustment_histories (action_by_user_id);
CREATE INDEX idx_adj_hist_action_at ON attendance_adjustment_histories (action_at);

ALTER TABLE attendance_adjustment_histories
    ADD CONSTRAINT FK_ADJ_HIST_ON_REQUEST
    FOREIGN KEY (adjustment_request_id) REFERENCES attendance_adjustment_requests (id);

ALTER TABLE attendance_adjustment_histories
    ADD CONSTRAINT FK_ADJ_HIST_ON_ACTION_BY
    FOREIGN KEY (action_by_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 6. NEW RBAC PERMISSIONS for Attendance Adjustment
-- ─────────────────────────────────────────────────────────────
INSERT INTO permissions (name, description, category, created_at, updated_at, is_deleted, version) VALUES
('ATTENDANCE_ADJUSTMENT_REQUEST',  'Submit manual attendance adjustment request',      'ATTENDANCE', NOW(), NOW(), FALSE, 0),
('ATTENDANCE_ADJUSTMENT_APPROVE',  'Approve or reject attendance adjustment requests', 'ATTENDANCE', NOW(), NOW(), FALSE, 0),
('ATTENDANCE_ADJUSTMENT_ADMIN',    'Admin: configure attendance adjustment workflows', 'ATTENDANCE', NOW(), NOW(), FALSE, 0),
('ATTENDANCE_CHECKIN',             'Check-in / check-out via camera & geolocation',   'ATTENDANCE', NOW(), NOW(), FALSE, 0);

-- Assign to ROLE_ADMIN (all)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN'
  AND p.name IN ('ATTENDANCE_ADJUSTMENT_REQUEST', 'ATTENDANCE_ADJUSTMENT_APPROVE',
                 'ATTENDANCE_ADJUSTMENT_ADMIN',   'ATTENDANCE_CHECKIN')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- Assign to ROLE_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_MANAGER'
  AND p.name IN ('ATTENDANCE_ADJUSTMENT_REQUEST', 'ATTENDANCE_ADJUSTMENT_APPROVE',
                 'ATTENDANCE_CHECKIN')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- Assign to ROLE_HR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_HR'
  AND p.name IN ('ATTENDANCE_ADJUSTMENT_REQUEST', 'ATTENDANCE_ADJUSTMENT_APPROVE',
                 'ATTENDANCE_CHECKIN')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- Assign to ROLE_EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_EMPLOYEE'
  AND p.name IN ('ATTENDANCE_ADJUSTMENT_REQUEST', 'ATTENDANCE_CHECKIN')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- ─────────────────────────────────────────────────────────────
-- 7. SEED DEFAULT WORKFLOW TEMPLATE
--    1-level approval, ROLE_MANAGER approves, 24h escalation
-- ─────────────────────────────────────────────────────────────
INSERT INTO workflow_templates
    (name, workflow_type, description, is_active, is_deleted, created_at, updated_at, version)
VALUES
    ('Default Manual Attendance Adjustment',
     'MANUAL_ATTENDANCE_ADJUSTMENT',
     'Default 1-level approval workflow: Manager approves attendance correction requests',
     TRUE, FALSE, NOW(), NOW(), 0);

INSERT INTO workflow_levels
    (template_id, level_number, assignee_type, assignee_role, assignee_user_id,
     timeout_hours, notes, is_deleted, created_at, updated_at, version)
VALUES
    (LAST_INSERT_ID(), 1, 'ROLE', 'ROLE_MANAGER', NULL,
     24, 'Direct manager approves. Auto-reminder after 24 hours.',
     FALSE, NOW(), NOW(), 0);
