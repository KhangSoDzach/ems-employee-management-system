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
