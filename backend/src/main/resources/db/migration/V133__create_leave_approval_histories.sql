-- Create leave_approval_histories table for audit trail of leave approval actions
CREATE TABLE IF NOT EXISTS leave_approval_histories (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    leave_id BIGINT NOT NULL,
    approver_user_id BIGINT NULL,
    approver_name VARCHAR(200) NULL,
    approval_level INT NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    comments VARCHAR(2000) NULL,
    action_at DATETIME NOT NULL,
    status_before VARCHAR(40) NULL,
    status_after VARCHAR(40) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by VARCHAR(255) NULL,

    INDEX idx_leave_hist_leave_id (leave_id),
    INDEX idx_leave_hist_approver (approver_user_id),
    INDEX idx_leave_hist_action_at (action_at),
    CONSTRAINT fk_leave_hist_leave FOREIGN KEY (leave_id) REFERENCES leaves(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;