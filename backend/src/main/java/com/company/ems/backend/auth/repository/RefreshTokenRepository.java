package com.company.ems.backend.auth.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.auth.entity.RefreshToken;

/**
 * Repository for RefreshToken entity
 * Provides database operations for refresh token management
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find refresh token by token hash
     * 
     * @param tokenHash SHA-256 hash of the token
     * @return Optional containing the refresh token if found
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Find all refresh tokens for a specific user
     * 
     * @param userId User ID
     * @return List of refresh tokens
     */
    List<RefreshToken> findByUserId(Long userId);

    /**
     * Find valid (non-revoked, non-expired) refresh token by hash
     * 
     * @param tokenHash SHA-256 hash of the token
     * @param now       Current timestamp
     * @return Optional containing the refresh token if valid
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash " +
            "AND rt.revoked = false AND rt.expiresAt > :now")
    Optional<RefreshToken> findValidTokenByHash(
            @Param("tokenHash") String tokenHash,
            @Param("now") LocalDateTime now);

    /**
     * Delete all refresh tokens for a specific user (logout all devices)
     * 
     * @param userId User ID
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * Delete expired refresh tokens (cleanup)
     * 
     * @param now Current timestamp
     * @return Number of deleted tokens
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Count active (non-revoked, non-expired) tokens for a user
     * 
     * @param userId User ID
     * @param now    Current timestamp
     * @return Number of active tokens
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user.id = :userId " +
            "AND rt.revoked = false AND rt.expiresAt > :now")
    long countActiveTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
