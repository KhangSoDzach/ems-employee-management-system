-- =====================================
-- V3: Create Refresh Tokens Table
-- Description: Add refresh token storage for JWT authentication
-- Author: EMS Backend Team
-- Date: 2026-02-04
-- =====================================

-- Table: refresh_tokens
-- Stores refresh tokens for secure token rotation and revocation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    
    -- Token hash (SHA-256) for secure storage
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- User association
    user_id BIGINT NOT NULL,
    
    -- Token expiration
    expires_at DATETIME(6) NOT NULL,
    
    -- Revocation flag for manual logout
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Device information for tracking
    device_info VARCHAR(500) NULL,
    
    -- Audit fields from BaseEntity
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    
    -- Soft delete fields
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by VARCHAR(255) NULL,
    
    PRIMARY KEY (id),
    
    -- Foreign key to users table
    CONSTRAINT fk_refresh_token_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Indexes for performance
    UNIQUE INDEX uk_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked (revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comment for documentation
ALTER TABLE refresh_tokens COMMENT = 'Refresh tokens for JWT authentication and secure logout';


ALTER TABLE users
    -- 2FA enable flag
    ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT '2FA is enabled for this user',

    -- TOTP secret key (encrypted, 32 characters Base32)
    ADD COLUMN two_factor_secret VARCHAR(255) NULL COMMENT 'Encrypted TOTP secret key',

    -- Recovery codes (JSON array, encrypted)
    ADD COLUMN recovery_codes TEXT NULL COMMENT 'Encrypted JSON array of one-time recovery codes',

    -- 2FA metadata
    ADD COLUMN two_factor_enabled_at DATETIME(6) NULL COMMENT 'Timestamp when 2FA was enabled',
    ADD COLUMN two_factor_disabled_at DATETIME(6) NULL COMMENT 'Timestamp when 2FA was disabled';

-- Add index for 2FA queries
CREATE INDEX idx_two_factor_enabled ON users(two_factor_enabled);

-- Comments for documentation
ALTER TABLE users COMMENT = 'System users with authentication, authorization and 2FA support';
