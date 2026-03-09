package com.company.ems.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.config.PasswordResetProperties;
import com.company.ems.backend.auth.entity.PasswordResetToken;
import com.company.ems.backend.auth.port.out.EmailPort;
import com.company.ems.backend.auth.repository.PasswordResetTokenRepository;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Application service for the "Forgot Password" OTP flow.
 *
 * Responsibilities:
 * 1. Generate a secure 6-digit OTP, hash it, persist, and send via email.
 * 2. Accept email + OTP + newPassword, validate the OTP, then reset the
 * password.
 *
 * Security considerations:
 * - Raw OTP is never stored; only its SHA-256 hash is persisted.
 * - EmailNotFound path returns the same response as a valid email
 * (anti-enumeration).
 * - Resend cooldown is enforced server-side to prevent OTP spam.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final String OTP_ERROR_CODE = "OTP_INVALID";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailPort emailPort;
    private final PasswordResetProperties properties;

    // ──────────────────────────────────────────────────────────────────────────
    // Step 1: Initiate (send OTP email)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Initiates a password reset by sending a 6-digit OTP to the user's email.
     *
     * Always returns silently even when the email is not found (anti-enumeration).
     *
     * @param email the user's email address
     */
    @Transactional
    public void initiatePasswordReset(String email) {
        log.info("Password reset requested for email: {}", email);

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset: email {} not found, returning silently (anti-enumeration)", email);
            return;
        }

        var user = userOpt.get();
        log.info("Password reset: user found [{}], proceeding...", user.getUsername());

        try {
            // Enforce resend cooldown
            enforceResendCooldown(user);

            // Remove any existing unused tokens
            tokenRepository.deleteUnusedTokensByUser(user);
            log.debug("Old unused tokens cleared for user [{}]", user.getUsername());

            // Generate OTP
            String otp = generateOtp();
            String otpHash = hashOtp(otp);
            log.debug("OTP generated and hashed for user [{}]", user.getUsername());

            // Persist hashed token
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .otpHash(otpHash)
                    .expiresAt(LocalDateTime.now().plusMinutes(properties.getOtpExpiryMinutes()))
                    .build();
            tokenRepository.save(token);
            log.debug("Token saved to DB for user [{}]", user.getUsername());

            // Send OTP email
            log.info("Attempting to send OTP email to [{}]...", user.getEmail());
            emailPort.sendPasswordResetOtp(user.getEmail(), otp);
            log.info("Password reset OTP sent successfully for user [{}]", user.getUsername());

        } catch (BusinessException e) {
            log.error("!!! initiatePasswordReset FAILED for user [{}]: {}", user.getUsername(), e.toString());
            throw e;
        } catch (Exception e) {
            log.error("!!! initiatePasswordReset FAILED for user [{}]: {} - {}",
                    user.getUsername(), e.getClass().getName(), e.getMessage(), e);
            throw new RuntimeException("Password reset failed: " + e.getMessage(), e);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Step 2: Reset password (verify OTP + set new password atomically)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Verifies the OTP and resets the user's password in one atomic transaction.
     *
     * @param email       the user's email address
     * @param otp         the 6-digit OTP the user entered
     * @param newPassword the new plain-text password to set
     * @throws BusinessException if the OTP is invalid, expired, already used, or
     *                           the email is unknown
     */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        log.debug("Password reset attempt for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(OTP_ERROR_CODE, "Mã OTP không hợp lệ hoặc đã hết hạn"));

        String otpHash = hashOtp(otp);

        PasswordResetToken token = tokenRepository.findActiveByOtpHash(otpHash)
                .orElseThrow(() -> new BusinessException(OTP_ERROR_CODE, "Mã OTP không hợp lệ hoặc đã hết hạn"));

        // Verify the token belongs to the correct user (prevents cross-user OTP
        // attacks)
        // Compare by email (not ID) to avoid NPE when IDs are null in test environments
        if (!token.getUser().getEmail().equalsIgnoreCase(user.getEmail())) {
            log.warn("OTP user mismatch: token for email {} used by email {}", token.getUser().getEmail(),
                    user.getEmail());
            throw new BusinessException(OTP_ERROR_CODE,
                    "Mã OTP không hợp lệ hoặc đã được sử dụng.");
        }

        if (!token.isValid()) {
            throw new BusinessException(OTP_ERROR_CODE,
                    token.isExpired() ? "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới."
                            : "Mã OTP không hợp lệ hoặc đã được sử dụng.");
        }

        // Mark token as consumed and update password
        token.consume();
        tokenRepository.save(token);

        user.setPassword(passwordEncoder.encode(newPassword));
        user.resetFailedAttempts(); // unlock account if it was locked
        userRepository.save(user);

        log.info("Password reset successful for user: {}", user.getUsername());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Throws BusinessException if the user has a recent unused token within the
     * cooldown window.
     */
    private void enforceResendCooldown(User user) {
        List<PasswordResetToken> activeTokens = tokenRepository.findActiveTokensByUser(user);
        if (!activeTokens.isEmpty()) {
            PasswordResetToken latest = activeTokens.get(0);
            LocalDateTime cooldownEnd = latest.getCreatedAt()
                    .plusSeconds(properties.getResendCooldownSeconds());
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                long secondsLeft = java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds();
                log.warn("OTP resend throttled for user {}: {} seconds remaining", user.getUsername(), secondsLeft);
                throw new BusinessException("OTP_COOLDOWN",
                        "Vui lòng đợi " + secondsLeft + " giây trước khi gửi lại mã.");
            }
        }
    }

    /**
     * Generate a cryptographically secure 6-digit numeric OTP.
     */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100_000 + random.nextInt(900_000); // range [100000, 999999]
        return String.valueOf(otp);
    }

    /**
     * Compute SHA-256 hash of the OTP and return it as a hex string.
     * The hash is what gets stored in the database.
     */
    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is guaranteed by Java spec so this should never happen
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
