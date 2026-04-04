-- Create leave_approval_histories table and seed LEAVE workflow template.
-- The long-leave rule in LeaveApprovalServiceImpl will auto-inject
-- an extra HR level at runtime when totalDays >= threshold (default: 2 days).
-- This migration is idempotent and safe to run multiple times.

-- ─────────────────────────────────────────────────────────────
-- 1. CREATE leave_approval_histories TABLE
--    Immutable audit trail for leave approval actions.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leave_approval_histories
(
    id               BIGINT AUTO_INCREMENT NOT NULL,
    created_at       DATETIME(6)           NOT NULL,
    updated_at       DATETIME(6)           NOT NULL,
    created_by       VARCHAR(255)          NULL,
    updated_by       VARCHAR(255)          NULL,
    version          BIGINT                NULL,
    deleted_at       DATETIME(6)           NULL,
    is_deleted       BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by       VARCHAR(255)          NULL,

    leave_id         BIGINT                NOT NULL,
    approver_user_id BIGINT                NULL,
    approver_name    VARCHAR(200)          NULL,
    approval_level   INT                   NOT NULL,
    action           VARCHAR(20)           NOT NULL,
    comments         VARCHAR(2000)         NULL,
    action_at        DATETIME(6)           NOT NULL,
    status_before    VARCHAR(40)           NULL,
    status_after     VARCHAR(40)           NOT NULL,

    CONSTRAINT pk_leave_approval_histories PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_leave_hist_leave_id    ON leave_approval_histories (leave_id);
CREATE INDEX idx_leave_hist_approver    ON leave_approval_histories (approver_user_id);
CREATE INDEX idx_leave_hist_action_at   ON leave_approval_histories (action_at);

ALTER TABLE leave_approval_histories
    ADD CONSTRAINT FK_LEAVE_HIST_ON_LEAVE
    FOREIGN KEY (leave_id) REFERENCES leaves (id);

-- ─────────────────────────────────────────────────────────────
-- 2. SEED LEAVE WORKFLOW TEMPLATE
--    1-level: ROLE_MANAGER approves all leave requests.
--    Leaves >= 2 days automatically get an extra HR level
--    (handled in application logic, not in the template).
-- ─────────────────────────────────────────────────────────────

INSERT INTO workflow_templates
    (name, workflow_type, description, is_active, is_deleted, created_at, updated_at, version)
SELECT
    'Default Leave Approval',
    'LEAVE',
    'Default 1-level approval workflow: Manager approves leave requests. Leaves >= 2 days require additional HR approval.',
    TRUE, FALSE, NOW(), NOW(), 0
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_templates
    WHERE workflow_type = 'LEAVE' AND is_active = TRUE AND is_deleted = FALSE
);

-- ─────────────────────────────────────────────────────────────
-- 2. SEED LEVEL 1: MANAGER
-- ─────────────────────────────────────────────────────────────

INSERT INTO workflow_levels
    (template_id, level_number, assignee_type, assignee_role, assignee_user_id,
     timeout_hours, notes, is_deleted, created_at, updated_at, version)
SELECT
    wt.id, 1, 'ROLE', 'ROLE_MANAGER', NULL,
    24, 'Direct manager approves leave requests.',
    FALSE, NOW(), NOW(), 0
FROM workflow_templates wt
WHERE wt.workflow_type = 'LEAVE'
  AND wt.is_active = TRUE
  AND wt.is_deleted = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM workflow_levels wl
      WHERE wl.template_id = wt.id AND wl.level_number = 1 AND wl.is_deleted = FALSE
  );
