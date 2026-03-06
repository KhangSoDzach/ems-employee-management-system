-- =====================================
-- V14: Leave Multi-Level Approval Workflow
-- Description:
--   1. Add multi-level workflow fields to `leaves` table
--   2. Create `leave_approval_histories` table (audit trail)
--   3. Add LEAVE workflow permissions
--   4. Seed default Leave workflow template (MANAGER → HR for long leaves)
--   5. Migrate old PENDING status → PENDING_LEVEL_1
-- Author: EMS Backend Team
-- Date: 2026-03-05
-- Note: Originally authored as V12; renumbered to V14 to resolve version
--       conflict with V12__attendance_checkin_photo_and_adjustment_workflow.sql
-- =====================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND `leaves` TABLE
--    Add multi-level approval tracking columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE leaves
    ADD COLUMN current_approval_level INT          NOT NULL DEFAULT 1
        COMMENT 'Current approval level the request is waiting at (1-based)',
    ADD COLUMN max_approval_level     INT          NOT NULL DEFAULT 1
        COMMENT 'Total number of approval levels for this request',
    ADD COLUMN workflow_template_id   BIGINT       NULL
        COMMENT 'FK to workflow_templates; null for legacy records',
    ADD COLUMN long_leave_hr_required BOOLEAN      NOT NULL DEFAULT FALSE
        COMMENT 'True when totalDays >= threshold and an extra HR level was auto-added';

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_WORKFLOW_TEMPLATE
    FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates (id);

CREATE INDEX idx_leaves_current_level ON leaves (current_approval_level, status);

-- ─────────────────────────────────────────────────────────────
-- 2. CREATE `leave_approval_histories` TABLE
--    Immutable audit trail for every state change in a leave request
--    Implements FR-WORKFLOW-007
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_approval_histories
(
    id                BIGINT AUTO_INCREMENT NOT NULL,
    created_at        DATETIME(6)           NOT NULL,
    updated_at        DATETIME(6)           NOT NULL,
    created_by        VARCHAR(255)          NULL,
    updated_by        VARCHAR(255)          NULL,
    version           BIGINT                NULL,

    -- Relations
    leave_id          BIGINT                NOT NULL    COMMENT 'FK to leaves',
    approver_user_id  BIGINT                NULL        COMMENT 'NULL for system-triggered transitions (e.g. migration)',

    -- Action details
    approval_level    INT                   NOT NULL    COMMENT 'Level at which this action was taken',
    action            VARCHAR(20)           NOT NULL    COMMENT 'APPROVE | REJECT | SEND_BACK | SUBMIT',
    comments          VARCHAR(2000)         NULL,
    action_at         DATETIME(6)           NOT NULL,

    -- Status snapshot
    status_before     VARCHAR(40)           NULL,
    status_after      VARCHAR(40)           NOT NULL,

    CONSTRAINT pk_leave_approval_histories PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail for every leave approval action (FR-WORKFLOW-007)';

CREATE INDEX idx_leave_hist_leave_id     ON leave_approval_histories (leave_id);
CREATE INDEX idx_leave_hist_approver     ON leave_approval_histories (approver_user_id);
CREATE INDEX idx_leave_hist_action_at    ON leave_approval_histories (action_at);

ALTER TABLE leave_approval_histories
    ADD CONSTRAINT FK_LEAVE_HIST_ON_LEAVE
    FOREIGN KEY (leave_id) REFERENCES leaves (id);

ALTER TABLE leave_approval_histories
    ADD CONSTRAINT FK_LEAVE_HIST_ON_APPROVER
    FOREIGN KEY (approver_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 3. NEW RBAC PERMISSIONS (Leave Balance management)
-- ─────────────────────────────────────────────────────────────
INSERT INTO permissions (name, description, category, created_at, updated_at, is_deleted, version)
VALUES
    ('LEAVE_BALANCE_READ',  'View leave balance of employees', 'LEAVE', NOW(), NOW(), FALSE, 0),
    ('LEAVE_BALANCE_WRITE', 'Manually adjust leave balance',   'LEAVE', NOW(), NOW(), FALSE, 0);

-- Grant LEAVE_BALANCE_READ to ADMIN, MANAGER, HR, EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_HR', 'ROLE_EMPLOYEE')
  AND p.name = 'LEAVE_BALANCE_READ'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- Grant LEAVE_BALANCE_WRITE to ADMIN and HR only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ROLE_ADMIN', 'ROLE_HR')
  AND p.name = 'LEAVE_BALANCE_WRITE'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
  );

-- ─────────────────────────────────────────────────────────────
-- 4. SEED DEFAULT LEAVE WORKFLOW TEMPLATE
--    1-level: MANAGER approves. For long leaves (≥5 days),
--    application layer auto-adds an HR level at runtime.
-- ─────────────────────────────────────────────────────────────
INSERT INTO workflow_templates
    (name, workflow_type, description, is_active, is_deleted, created_at, updated_at, version)
VALUES (
    'Default Leave Approval',
    'LEAVE',
    'Default 1-level approval: Manager approves. For leaves >= 5 days, system automatically adds HR level.',
    TRUE, FALSE, NOW(), NOW(), 0
);

INSERT INTO workflow_levels
    (template_id, level_number, assignee_type, assignee_role, assignee_user_id,
     timeout_hours, notes, is_deleted, created_at, updated_at, version)
VALUES (
    LAST_INSERT_ID(),
    1,
    'ROLE',
    'ROLE_MANAGER',
    NULL,
    24,
    'Direct manager approves. Auto-reminder after 24 hours.',
    FALSE, NOW(), NOW(), 0
);

-- ─────────────────────────────────────────────────────────────
-- 5. DATA MIGRATION: old PENDING → PENDING_LEVEL_1
--    Migrate legacy leave records so they are compatible with
--    the new multi-level status model.
-- ─────────────────────────────────────────────────────────────
UPDATE leaves
SET status                = 'PENDING_LEVEL_1',
    current_approval_level = 1,
    max_approval_level     = 1,
    updated_at             = NOW()
WHERE status = 'PENDING';
