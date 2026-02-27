package com.company.ems.backend.security.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.exception.UnauthorizedException;
import com.company.ems.backend.security.dto.Disable2FARequest;
import com.company.ems.backend.security.dto.TwoFactorAuthResponse;
import com.company.ems.backend.security.dto.Verify2FARequest;
import com.company.ems.backend.security.util.RecoveryCodeUtil;
import com.company.ems.backend.security.util.TOTPUtil;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorAuthServiceImpl implements TwoFactorAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TOTPUtil totpUtil;
    private final RecoveryCodeUtil recoveryCodeUtil;
    private final ObjectMapper objectMapper;

    /**
     * Setup 2FA - Generate secret and QR code
     * Secret is temporarily stored but 2FA is not enabled until verified
     */
    @Override
    @Transactional
    public TwoFactorAuthResponse setup2FA(String username) {
        log.info("Setting up 2FA for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getTwoFactorEnabled()) {
            throw new BusinessException("2FA is already enabled for this user");
        }

        // Generate new secret
        String secret = totpUtil.generateSecret();

        // Generate QR code
        String qrCode = totpUtil.generateQRCode(secret, user.getEmail());

        // Save secret temporarily (not enabled yet)
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        log.info("2FA setup initiated for user: {}. Secret generated.", username);

        return TwoFactorAuthResponse.builder()
                .message("Scan the QR code with your authenticator app and verify the code to complete setup")
                .secret(secret)
                .qrCode(qrCode)
                .enabled(false)
                .build();
    }

    /**
     * Verify and enable 2FA - Verify TOTP code and generate recovery codes
     */
    @Override
    @Transactional
    public TwoFactorAuthResponse verify2FA(String username, Verify2FARequest request) {
        log.info("Verifying 2FA setup for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getTwoFactorSecret() == null) {
            throw new BusinessException("2FA setup not initiated. Please start setup first.");
        }

        if (user.getTwoFactorEnabled()) {
            throw new BusinessException("2FA is already enabled");
        }

        // Verify TOTP code
        if (!totpUtil.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            log.warn("Invalid 2FA verification code for user: {}", username);
            throw new UnauthorizedException("Invalid verification code");
        }

        // Generate recovery codes
        List<String> recoveryCodes = recoveryCodeUtil.generateRecoveryCodes();
        List<String> hashedCodes = recoveryCodeUtil.hashRecoveryCodes(recoveryCodes);

        // Store hashed recovery codes as JSON
        try {
            String recoveryCodesJson = objectMapper.writeValueAsString(hashedCodes);
            user.setRecoveryCodes(recoveryCodesJson);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize recovery codes", e);
            throw new BusinessException("Failed to generate recovery codes");
        }

        // Enable 2FA
        user.setTwoFactorEnabled(true);
        user.setTwoFactorEnabledAt(LocalDateTime.now());
        user.setTwoFactorDisabledAt(null);

        userRepository.save(user);

        log.info("2FA enabled successfully for user: {}", username);

        return TwoFactorAuthResponse.builder()
                .message("2FA has been enabled successfully. Save your recovery codes in a safe place.")
                .enabled(true)
                .recoveryCodes(recoveryCodes)
                .build();
    }

    /**
     * Disable 2FA - Requires password or OTP verification
     */
    @Override
    @Transactional
    public TwoFactorAuthResponse disable2FA(String username, Disable2FARequest request) {
        log.info("Disabling 2FA for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getTwoFactorEnabled()) {
            throw new BusinessException("2FA is not enabled for this user");
        }

        // Verify password OR verification code
        boolean verified = false;

        // Try password verification first
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                verified = true;
            }
        }

        // Try OTP verification if password not provided or failed
        if (!verified && request.getVerificationCode() != null) {
            if (totpUtil.verifyCode(user.getTwoFactorSecret(), request.getVerificationCode())) {
                verified = true;
            }
        }

        if (!verified) {
            log.warn("Failed to disable 2FA for user: {} - verification failed", username);
            throw new UnauthorizedException("Invalid password or verification code");
        }

        // Disable 2FA
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.setRecoveryCodes(null);
        user.setTwoFactorDisabledAt(LocalDateTime.now());

        userRepository.save(user);

        log.info("2FA disabled successfully for user: {}", username);

        // TODO: Send email notification
        // sendDisableNotificationEmail(user.getEmail());

        return TwoFactorAuthResponse.builder()
                .message("2FA has been disabled successfully")
                .enabled(false)
                .build();
    }

    /**
     * Verify TOTP code for login (or recovery code)
     */
    @Override
    @Transactional(readOnly = true)
    public boolean verifyCodeForLogin(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
            return false;
        }

        // Try TOTP verification first
        if (totpUtil.verifyCode(user.getTwoFactorSecret(), code)) {
            log.info("TOTP code verified for user: {}", username);
            return true;
        }

        // Try recovery code if TOTP failed
        if (user.getRecoveryCodes() != null) {
            try {
                List<String> hashedCodes = objectMapper.readValue(
                        user.getRecoveryCodes(),
                        new TypeReference<List<String>>() {}
                );

                int codeIndex = recoveryCodeUtil.verifyRecoveryCode(code, hashedCodes);

                if (codeIndex >= 0) {
                    log.info("Recovery code verified for user: {}", username);
                    // Remove used recovery code
                    hashedCodes.remove(codeIndex);
                    user.setRecoveryCodes(objectMapper.writeValueAsString(hashedCodes));
                    userRepository.save(user);
                    return true;
                }
            } catch (JsonProcessingException e) {
                log.error("Failed to parse recovery codes for user: {}", username, e);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        log.warn("Invalid 2FA code for login - user: {}", username);
        return false;
    }

    /**
     * Check if 2FA is enabled for user
     */
    @Override
    @Transactional(readOnly = true)
    public boolean is2FAEnabled(String username) {
        return userRepository.findByUsername(username)
                .map(User::getTwoFactorEnabled)
                .orElse(false);
    }
}
