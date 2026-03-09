package com.company.ems.backend.auth.service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.entity.RefreshToken;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final MessageService messages;
    private final UserRepository userRepository;
    private final JwtTokenUtil jwtTokenUtil;
    private final RefreshTokenService refreshTokenService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtProperties jwtProperties;
    private final AuditLogService auditLogService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    @Transactional
    public AuthResponse login(LoginRequest request, RequestContext ctx) {
        log.debug("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    auditLogService.logAuthEvent(
                            AuthActionType.LOGIN_FAILED, "ANONYMOUS", null,
                            request.getUsername(), "JWT", "FAILED", ctx);
                    return new BadCredentialsException(messages.get(MessageCode.ERROR_BAD_CREDENTIALS));
                });

        if (user.isAccountLocked()) {
            log.warn("Login attempt for locked account: {}", request.getUsername());
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new LockedException(
                    messages.get(MessageCode.ERROR_ACCOUNT_LOCKED_DETAIL));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));

            if (user.getFailedLoginAttempts() > 0) {
                user.resetFailedAttempts();
                userRepository.save(user);
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = jwtTokenUtil.generateAccessToken(userDetails);
            String deviceInfo = buildDeviceInfo(ctx);
            String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_SUCCESS,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "SUCCESS", ctx);

            log.info("Login successful for user: {}", request.getUsername());

            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            handleFailedLoginAttempt(user);
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new BadCredentialsException(messages.get(MessageCode.ERROR_BAD_CREDENTIALS));
        } catch (DisabledException e) {
            log.warn("Login attempt for disabled account: {}", request.getUsername());
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new DisabledException(messages.get(MessageCode.ERROR_ACCOUNT_DISABLED));
        }
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenString, RequestContext ctx) {
        log.debug("Refreshing access token");

        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenString)
                .orElseThrow(() -> {
                    auditLogService.logAuthEvent(
                            AuthActionType.TOKEN_REFRESH_FAILED, "ANONYMOUS", null,
                            null, "JWT", "FAILED", ctx);
                    return new BadCredentialsException(messages.get(MessageCode.ERROR_REFRESH_TOKEN_INVALID));
                });

        User user = refreshToken.getUser();

        refreshTokenService.revokeRefreshToken(refreshTokenString);
        log.info("Old refresh token revoked for rotation: {}", user.getUsername());
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newAccessToken = jwtTokenUtil.generateAccessToken(userDetails);
        String deviceInfo = buildDeviceInfo(ctx);
        String newRefreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);
        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_REFRESH_SUCCESS,
                String.valueOf(user.getId()),
                String.valueOf(user.getId()),
                user.getUsername(), "JWT", "SUCCESS", ctx);

        log.info("Access token refreshed and rotated for user: {}", user.getUsername());

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshToken, String actor, RequestContext ctx) {
        log.debug("Logout request");
        boolean revoked = refreshTokenService.revokeRefreshToken(refreshToken);
        if (revoked) {
            auditLogService.logAuthEvent(
                    AuthActionType.LOGOUT, actor, actor,
                    actor, "JWT", "SUCCESS", ctx);
            log.info("User logged out successfully");
        } else {
            log.warn("Logout failed: token not found");
        }
    }

    @Transactional
    public void logoutAllDevices(Long userId, String actor, RequestContext ctx) {
        log.debug("Logout all devices for user ID: {}", userId);
        refreshTokenService.revokeAllUserTokens(userId);
        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_REVOKED, actor, String.valueOf(userId),
                actor, "JWT", "SUCCESS", ctx);
        log.info("User logged out from all devices: {}", userId);
    }

    private void handleFailedLoginAttempt(User user) {
        user.incrementFailedAttempts();

        if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
            user.lockAccount(LOCK_DURATION_MINUTES);
            log.warn("Account locked due to {} failed attempts: {}", MAX_FAILED_ATTEMPTS, user.getUsername());
        } else {
            log.warn("Failed login attempt {} of {} for user: {}",
                    user.getFailedLoginAttempts(), MAX_FAILED_ATTEMPTS, user.getUsername());
        }

        userRepository.save(user);
    }

    private String buildDeviceInfo(RequestContext ctx) {
        if (ctx == null) return "Unknown";
        String ua = ctx.getUserAgent() != null ? ctx.getUserAgent() : "Unknown";
        String ip = ctx.getIpAddress() != null ? ctx.getIpAddress() : "Unknown";
        return ua + " | IP: " + ip;
    }

    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found: " + username));
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getExpirationMs() / 1000) // Convert to seconds
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .roles(user.getRoles().stream()
                                .map(role -> role.getName())
                                .collect(Collectors.toList()))
                        .build())
                .build();
    }
}