package com.company.ems.backend.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.entity.RefreshToken;
import com.company.ems.backend.auth.repository.RefreshTokenRepository;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.user.entity.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing refresh tokens
 * Handles token creation, validation, rotation, and cleanup
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenUtil jwtTokenUtil;
    private final JwtProperties jwtProperties;

    /**
     * Create and store a new refresh token for user
     *
     * @param user       User entity
     * @param deviceInfo Device information (User-Agent, IP, etc.)
     * @return Generated refresh token string
     */
    @Transactional
    public String createRefreshToken(User user, String deviceInfo) {
        log.debug("Creating refresh token for user: {}", user.getUsername());

        // Generate JWT refresh token
        String tokenString = jwtTokenUtil.generateRefreshToken(user.getId());

        // Hash token before storage (security best practice)
        String tokenHash = jwtTokenUtil.hashToken(tokenString);

        // Calculate expiration
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(jwtProperties.getRefreshExpirationMs() / 1000);

        // Create and save refresh token entity
        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiresAt(expiresAt)
                .deviceInfo(deviceInfo)
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        log.info("Refresh token created for user: {} (device: {})", user.getUsername(), deviceInfo);
        return tokenString;
    }

    /**
     * Validate refresh token
     *
     * @param tokenString Refresh token to validate
     * @return Optional containing RefreshToken entity if valid
     */
    @Transactional(readOnly = true)
    public Optional<RefreshToken> validateRefreshToken(String tokenString) {
        log.debug("Validating refresh token");

        // Validate JWT signature and expiration
        if (!jwtTokenUtil.validateRefreshToken(tokenString)) {
            log.warn("Invalid refresh token signature or expired JWT");
            return Optional.empty();
        }

        // Hash token to find in database
        String tokenHash = jwtTokenUtil.hashToken(tokenString);

        // Find valid (non-revoked, non-expired) token
        Optional<RefreshToken> refreshToken = refreshTokenRepository
                .findValidTokenByHash(tokenHash, LocalDateTime.now());

        if (refreshToken.isEmpty()) {
            log.warn("Refresh token not found or already revoked");
        }

        return refreshToken;
    }

    /**
     * Rotate refresh token (create new, revoke old)
     * Recommended for security to prevent token reuse
     *
     * @param oldTokenString Old refresh token
     * @param deviceInfo     Device information
     * @return New refresh token string
     */
    @Transactional
    public Optional<String> rotateRefreshToken(String oldTokenString, String deviceInfo) {
        log.debug("Rotating refresh token");

        Optional<RefreshToken> oldTokenOpt = validateRefreshToken(oldTokenString);
        if (oldTokenOpt.isEmpty()) {
            log.warn("Cannot rotate: old token is invalid");
            return Optional.empty();
        }

        RefreshToken oldToken = oldTokenOpt.get();
        User user = oldToken.getUser();

        // Revoke old token
        oldToken.revoke();
        refreshTokenRepository.save(oldToken);

        // Create new token
        String newTokenString = createRefreshToken(user, deviceInfo);

        log.info("Refresh token rotated for user: {}", user.getUsername());
        return Optional.of(newTokenString);
    }

    /**
     * Revoke a specific refresh token (logout from one device)
     *
     * @param tokenString Refresh token to revoke
     * @return true if token was revoked successfully
     */
    @Transactional
    public boolean revokeRefreshToken(String tokenString) {
        log.debug("Revoking refresh token");

        String tokenHash = jwtTokenUtil.hashToken(tokenString);
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            log.warn("Refresh token not found for revocation");
            return false;
        }

        RefreshToken token = tokenOpt.get();
        token.revoke();
        refreshTokenRepository.save(token);

        log.info("Refresh token revoked for user: {}", token.getUser().getUsername());
        return true;
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     *
     * @param userId User ID
     */
    @Transactional
    public void revokeAllUserTokens(Long userId) {
        log.debug("Revoking all refresh tokens for user ID: {}", userId);

        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(userId);
        tokens.forEach(RefreshToken::revoke);
        refreshTokenRepository.saveAll(tokens);

        log.info("All refresh tokens revoked for user ID: {} ({} tokens)", userId, tokens.size());
    }

    /**
     * Cleanup expired refresh tokens
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.debug("Running scheduled cleanup of expired refresh tokens");

        int deletedCount = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());

        log.info("Cleanup completed: {} expired tokens deleted", deletedCount);
    }

    /**
     * Get count of active tokens for a user
     *
     * @param userId User ID
     * @return Number of active tokens
     */
    @Transactional(readOnly = true)
    public long countActiveTokens(Long userId) {
        return refreshTokenRepository.countActiveTokensByUserId(userId, LocalDateTime.now());
    }
}
