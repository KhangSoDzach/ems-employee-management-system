package com.company.ems.backend.auth.service;

import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import com.company.ems.backend.audit.event.AuditLogEvent;
import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.entity.RefreshToken;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final AuthenticationManager     authenticationManager;
    private final UserRepository            userRepository;
    private final JwtTokenUtil              jwtTokenUtil;
    private final RefreshTokenService       refreshTokenService;
    private final CustomUserDetailsService  userDetailsService;
    private final JwtProperties             jwtProperties;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_FAILED_ATTEMPTS   = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        log.debug("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null) {
            publishAudit(null, request.getUsername(),
                    AuditActionType.LOGIN_FAILED, AuditResult.FAILED,
                    deviceInfo, "User not found");
            throw new BadCredentialsException("Invalid username or password");
        }

        if (user.isAccountLocked()) {
            publishAudit(user.getId(), request.getUsername(),
                    AuditActionType.LOGIN_FAILED, AuditResult.DENIED,
                    deviceInfo, "Account is locked");
            throw new LockedException(
                    "Account is locked due to multiple failed login attempts. Please try again later.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));

            if (user.getFailedLoginAttempts() > 0) {
                user.resetFailedAttempts();
            }
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken  = jwtTokenUtil.generateAccessToken(userDetails);
            String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

            publishAudit(user.getId(), request.getUsername(),
                    AuditActionType.LOGIN_SUCCESS, AuditResult.SUCCESS,
                    deviceInfo, null);

            log.info("Login successful for user: {}", request.getUsername());
            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            handleFailedLogin(user, request.getUsername(), deviceInfo);
            throw new BadCredentialsException("Invalid username or password");

        } catch (DisabledException e) {
            publishAudit(user.getId(), request.getUsername(),
                    AuditActionType.LOGIN_FAILED, AuditResult.DENIED,
                    deviceInfo, "Account is disabled");
            throw new DisabledException("Account is disabled");
        }
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenString, String deviceInfo) {
        RefreshToken refreshToken = refreshTokenService
                .validateRefreshToken(refreshTokenString).orElse(null);

        if (refreshToken == null) {
            publishAudit(null, null,
                    AuditActionType.TOKEN_REFRESH_FAILED, AuditResult.FAILED,
                    deviceInfo, "Invalid or expired refresh token");
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        User user = refreshToken.getUser();
        refreshTokenService.revokeRefreshToken(refreshTokenString);

        publishAudit(user.getId(), user.getUsername(),
                AuditActionType.TOKEN_REVOKED, AuditResult.SUCCESS,
                deviceInfo, "Token rotated");

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newAccessToken  = jwtTokenUtil.generateAccessToken(userDetails);
        String newRefreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

        publishAudit(user.getId(), user.getUsername(),
                AuditActionType.TOKEN_REFRESH_SUCCESS, AuditResult.SUCCESS,
                deviceInfo, null);

        log.info("Token refreshed and rotated for user: {}", user.getUsername());
        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshToken, String deviceInfo, Long userId, String username) {
        boolean revoked = refreshTokenService.revokeRefreshToken(refreshToken);
        if (revoked) {
            publishAudit(userId, username,
                    AuditActionType.LOGOUT, AuditResult.SUCCESS,
                    deviceInfo, null);
            log.info("User [{}] logged out", username);
        } else {
            publishAudit(userId,username, AuditActionType.LOGOUT, AuditResult.FAILED,
                    deviceInfo, "Refresh token not found or already revoked");
            log.warn("Logout attempted with invalid/revoked token for user [{}]", username);
        }
    }

    @Transactional
    public void logoutAllDevices(Long userId, String username, String deviceInfo) {
        refreshTokenService.revokeAllUserTokens(userId);
        publishAudit(userId, username,
                AuditActionType.LOGOUT_ALL_DEVICES, AuditResult.SUCCESS,
                deviceInfo, "Logout from all devices");
    }

    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found: " + username));
    }

    private void publishAudit(Long userId, String identifier,
                              AuditActionType actionType, AuditResult result,
                              String deviceInfo, String message) {
        try {
            eventPublisher.publishEvent(
                    AuditLogEvent.builder()
                            .source(this)
                            .userId(userId)
                            .identifierAttempted(identifier)
                            .actionType(actionType)
                            .result(result)
                            .loginMethod(LoginMethod.JWT)
                            .ipAddress(extractIp(deviceInfo))
                            .userAgent(extractUa(deviceInfo))
                            .clientType(detectClientType(extractUa(deviceInfo)))
                            .message(message)
                            .build());
        } catch (Exception ex) {
            log.error("Failed to publish audit event: {}", ex.getMessage());
        }
    }

    private void handleFailedLogin(User user, String identifier, String deviceInfo) {
        user.incrementFailedAttempts();
        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.lockAccount(LOCK_DURATION_MINUTES);
            userRepository.save(user);
            publishAudit(user.getId(), identifier,
                    AuditActionType.ACCOUNT_LOCKED, AuditResult.FAILED,
                    deviceInfo, "Locked after " + MAX_FAILED_ATTEMPTS + " failed attempts");
        } else {
            userRepository.save(user);
            publishAudit(user.getId(), identifier,
                    AuditActionType.LOGIN_FAILED, AuditResult.FAILED,
                    deviceInfo, "Bad credentials attempt " + user.getFailedLoginAttempts());
        }
    }

    private String extractIp(String deviceInfo) {
        if (deviceInfo == null) return "unknown";
        int idx = deviceInfo.lastIndexOf("| IP: ");
        return idx == -1 ? "unknown" : deviceInfo.substring(idx + 6).trim();
    }

    private String extractUa(String deviceInfo) {
        if (deviceInfo == null) return "unknown";
        int idx = deviceInfo.lastIndexOf(" | IP:");
        return idx > 0 ? deviceInfo.substring(0, idx).trim() : deviceInfo;
    }

    private String detectClientType(String ua) {
        if (ua == null) return "UNKNOWN";
        String u = ua.toLowerCase();
        if (u.contains("mobile") || u.contains("android") || u.contains("iphone")) return "MOBILE";
        if (u.contains("postman") || u.contains("insomnia") || u.contains("curl"))  return "API";
        return "WEB";
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpirationMs() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .roles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()))
                        .build())
                .build();
    }
}