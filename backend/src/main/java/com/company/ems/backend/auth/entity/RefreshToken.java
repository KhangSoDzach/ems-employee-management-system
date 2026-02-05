package com.company.ems.backend.auth.entity;

import java.time.LocalDateTime;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * RefreshToken entity for JWT authentication
 * Stores refresh tokens for secure token rotation and revocation
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "uk_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_expires_at", columnList = "expires_at"),
        @Index(name = "idx_revoked", columnList = "revoked")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken extends BaseEntity {

    /**
     * SHA-256 hash of the refresh token
     * Tokens are hashed before storage for security
     */
    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    /**
     * User who owns this refresh token
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Token expiration timestamp
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Flag indicating if token has been revoked (logout)
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    /**
     * Device information (User-Agent, IP, etc.) for tracking
     */
    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    /**
     * Check if this refresh token is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if this refresh token is revoked
     */
    public boolean isRevoked() {
        return Boolean.TRUE.equals(revoked);
    }

    /**
     * Check if this refresh token is valid (not expired and not revoked)
     */
    public boolean isValid() {
        return !isExpired() && !isRevoked();
    }

    /**
     * Revoke this refresh token (for logout)
     */
    public void revoke() {
        this.revoked = true;
    }
}
