package com.company.ems.backend.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.ems.backend.auth.entity.PasswordResetToken;
import com.company.ems.backend.user.entity.User;

/**
 * Repository for PasswordResetToken persistence operations.
 * Data access only – no business logic here (per architecture rules).
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find the most recent unused, non-deleted token by OTP hash.
     * Used to verify the OTP a user submitted.
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.otpHash = :otpHash AND t.used = false AND t.isDeleted = false")
    Optional<PasswordResetToken> findActiveByOtpHash(@Param("otpHash") String otpHash);

    /**
     * Find all unused, non-deleted tokens belonging to a user (ordered newest
     * first).
     * Used to enforce the resend cooldown.
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.used = false AND t.isDeleted = false ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findActiveTokensByUser(@Param("user") User user);

    /**
     * Hard-delete all unused tokens for a user before issuing a new one.
     * Keeps the table clean; used tokens are retained for audit purposes.
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user AND t.used = false")
    void deleteUnusedTokensByUser(@Param("user") User user);
}
