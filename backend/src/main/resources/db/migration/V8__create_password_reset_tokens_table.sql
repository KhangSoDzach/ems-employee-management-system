-- =====================================
-- V8: Create Password Reset Tokens Table
-- Description: Stores OTP tokens for the "Forgot Password" flow
-- Author: EMS Backend Team
-- Date: 2026-02-27
-- =====================================

CREATE TABLE IF NOT EXISTS password_reset_tokens
(
    id          BIGINT          NOT NULL AUTO_INCREMENT,

    -- User who requested the reset
    user_id     BIGINT          NOT NULL,

    -- SHA-256 hex hash of the 6-digit OTP (stored hashed for security)
    otp_hash    VARCHAR(64)     NOT NULL,

    -- Token expiration timestamp
    expires_at  DATETIME(6)     NOT NULL,

    -- Whether this token has already been used to reset the password
    used        BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Audit fields (matches BaseEntity)
    created_at  DATETIME(6)     NOT NULL,
    updated_at  DATETIME(6)     NOT NULL,
    created_by  VARCHAR(255)    NULL,
    updated_by  VARCHAR(255)    NULL,
    version     BIGINT          NULL,
    deleted_at  DATETIME(6)     NULL,
    is_deleted  BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_by  VARCHAR(255)    NULL,

    PRIMARY KEY (id),

    CONSTRAINT fk_prt_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,

    INDEX idx_prt_user_id   (user_id),
    INDEX idx_prt_expires   (expires_at),
    INDEX idx_prt_used      (used)

) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'OTP tokens for the Forgot Password reset flow';
