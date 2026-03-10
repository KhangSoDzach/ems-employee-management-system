package com.company.ems.backend.security.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.exception.UnauthorizedException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
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
    private final MessageService messages;
    private final PasswordEncoder passwordEncoder;
    private final TOTPUtil totpUtil;
    private final RecoveryCodeUtil recoveryCodeUtil;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public TwoFactorAuthResponse setup2FA(String username) {
        log.info("Setting up 2FA for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (user.getTwoFactorEnabled()) {
            throw new BusinessException(messages.get(MessageCode.TWO_FA_ALREADY_ENABLED));
        }

        String secret = totpUtil.generateSecret();

        String qrCode = totpUtil.generateQRCode(secret, user.getEmail());

        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        log.info("2FA setup initiated for user: {}. Secret generated.", username);

        return TwoFactorAuthResponse.builder()
                .message(messages.get(MessageCode.TWO_FA_SETUP_MSG))
                .secret(secret)
                .qrCode(qrCode)
                .enabled(false)
                .build();
    }

    @Override
    @Transactional
    public TwoFactorAuthResponse verify2FA(String username, Verify2FARequest request) {
        log.info("Verifying 2FA setup for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (user.getTwoFactorSecret() == null) {
            throw new BusinessException(messages.get(MessageCode.TWO_FA_NOT_INITIATED));
        }

        if (user.getTwoFactorEnabled()) {
            throw new BusinessException(messages.get(MessageCode.TWO_FA_ALREADY_ENABLED));
        }

        if (!totpUtil.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            log.warn("Invalid 2FA verification code for user: {}", username);
            throw new UnauthorizedException(messages.get(MessageCode.TWO_FA_INVALID_CODE));
        }

        List<String> recoveryCodes = recoveryCodeUtil.generateRecoveryCodes();
        List<String> hashedCodes = recoveryCodeUtil.hashRecoveryCodes(recoveryCodes);

        try {
            String recoveryCodesJson = objectMapper.writeValueAsString(hashedCodes);
            user.setRecoveryCodes(recoveryCodesJson);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize recovery codes", e);
            throw new BusinessException(messages.get(MessageCode.TWO_FA_RECOVERY_FAILED));
        }

        user.setTwoFactorEnabled(true);
        user.setTwoFactorEnabledAt(LocalDateTime.now());
        user.setTwoFactorDisabledAt(null);

        userRepository.save(user);

        log.info("2FA enabled successfully for user: {}", username);

        return TwoFactorAuthResponse.builder()
                .message(messages.get(MessageCode.TWO_FA_ENABLED_MSG))
                .enabled(true)
                .recoveryCodes(recoveryCodes)
                .build();
    }

    @Override
    @Transactional
    public TwoFactorAuthResponse disable2FA(String username, Disable2FARequest request) {
        log.info("Disabling 2FA for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (!user.getTwoFactorEnabled()) {
            throw new BusinessException(messages.get(MessageCode.TWO_FA_NOT_ENABLED));
        }

        boolean verified = false;

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                verified = true;
            }
        }

        if (!verified && request.getVerificationCode() != null) {
            if (totpUtil.verifyCode(user.getTwoFactorSecret(), request.getVerificationCode())) {
                verified = true;
            }
        }

        if (!verified) {
            log.warn("Failed to disable 2FA for user: {} - verification failed", username);
            throw new UnauthorizedException(messages.get(MessageCode.TWO_FA_INVALID_PASSWORD_CODE));
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.setRecoveryCodes(null);
        user.setTwoFactorDisabledAt(LocalDateTime.now());

        userRepository.save(user);

        log.info("2FA disabled successfully for user: {}", username);
        // TODO: Send email notification
        return TwoFactorAuthResponse.builder()
                .message(messages.get(MessageCode.TWO_FA_DISABLED_MSG))
                .enabled(false)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyCodeForLogin(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (!user.getTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
            return false;
        }

        if (totpUtil.verifyCode(user.getTwoFactorSecret(), code)) {
            log.info("TOTP code verified for user: {}", username);
            return true;
        }

        if (user.getRecoveryCodes() != null) {
            try {
                List<String> hashedCodes = objectMapper.readValue(
                        user.getRecoveryCodes(),
                        new TypeReference<List<String>>() {}
                );

                int codeIndex = recoveryCodeUtil.verifyRecoveryCode(code, hashedCodes);

                if (codeIndex >= 0) {
                    log.info("Recovery code verified for user: {}", username);
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

    @Override
    @Transactional(readOnly = true)
    public boolean is2FAEnabled(String username) {
        return userRepository.findByUsername(username)
                .map(User::getTwoFactorEnabled)
                .orElse(false);
    }
}