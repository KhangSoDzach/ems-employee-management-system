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
 * Entity representing a one-time OTP token for the "Forgot Password" flow.
 * The raw OTP is never stored; only its SHA-256 hash is persisted.
 */
@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "idx_prt_user_id", columnList = "user_id"),
        @Index(name = "idx_prt_expires", columnList = "expires_at"),
        @Index(name = "idx_prt_used", columnList = "used")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken extends BaseEntity {

    /**
     * User who requested the password reset.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * SHA-256 hex hash of the 6-digit OTP.
     * The raw OTP is never stored.
     */
    @Column(name = "otp_hash", nullable = false, length = 64)
    private String otpHash;

    /**
     * Timestamp after which this token is no longer valid.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Whether this token has already been consumed to reset the password.
     * Once true the token must not be reused.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;

    // ──────────────────────────────────────────────────────────────
    // Behavior methods (keep logic inside the entity, not in service)
    // ──────────────────────────────────────────────────────────────

    /**
     * Returns true if the token's expiry time has passed.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Returns true if the token has already been used.
     */
    public boolean isConsumed() {
        return Boolean.TRUE.equals(used);
    }

    /**
     * Returns true only when the token is both non-expired and not yet used.
     */
    public boolean isValid() {
        return !isExpired() && !isConsumed();
    }

    /**
     * Marks the token as consumed so it cannot be reused.
     */
    public void consume() {
        this.used = true;
    }
}
