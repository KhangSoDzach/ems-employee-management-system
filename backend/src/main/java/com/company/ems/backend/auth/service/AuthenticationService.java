package com.company.ems.backend.auth.service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

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

/**
 * Service for authentication operations
 * Handles login, logout, and token refresh
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenUtil jwtTokenUtil;
    private final RefreshTokenService refreshTokenService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtProperties jwtProperties;
    private final AuditLogService auditLogService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    /**
     * Authenticate user and return JWT tokens.
     *
     * @param request Login request with username and password
     * @param ctx     Per-request network context (IP, User-Agent, etc.)
     * @return Authentication response with access and refresh tokens
     */
    @Transactional
    public AuthResponse login(LoginRequest request, RequestContext ctx) {
        log.debug("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    // AC-02: log failed attempt even when user is not found
                    auditLogService.logAuthEvent(
                            AuthActionType.LOGIN_FAILED, "ANONYMOUS", null,
                            request.getUsername(), "JWT", "FAILED", ctx);
                    return new BadCredentialsException("Invalid username or password");
                });

        // Check if account is locked
        if (user.isAccountLocked()) {
            log.warn("Login attempt for locked account: {}", request.getUsername());
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new LockedException(
                    "Account is locked due to multiple failed login attempts. Please try again later.");
        }

        try {
            // Authenticate with Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));

            // Authentication successful – reset failed attempts
            if (user.getFailedLoginAttempts() > 0) {
                user.resetFailedAttempts();
                userRepository.save(user);
            }

            // Update last login time
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Generate tokens
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = jwtTokenUtil.generateAccessToken(userDetails);
            String deviceInfo = buildDeviceInfo(ctx);
            String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

            // AC-01: log successful login
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_SUCCESS,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "SUCCESS", ctx);

            log.info("Login successful for user: {}", request.getUsername());

            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            // AC-02: log failed login
            handleFailedLoginAttempt(user);
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new BadCredentialsException("Invalid username or password");
        } catch (DisabledException e) {
            log.warn("Login attempt for disabled account: {}", request.getUsername());
            auditLogService.logAuthEvent(
                    AuthActionType.LOGIN_FAILED,
                    String.valueOf(user.getId()),
                    String.valueOf(user.getId()),
                    request.getUsername(), "JWT", "FAILED", ctx);
            throw new DisabledException("Account is disabled");
        }
    }

    /**
     * Refresh access token using refresh token.
     *
     * @param refreshTokenString Refresh token
     * @param ctx                Per-request network context (IP, User-Agent, etc.)
     * @return New authentication response with new access token and new refresh token
     */
    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenString, RequestContext ctx) {
        log.debug("Refreshing access token");

        // Validate refresh token
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenString)
                .orElseThrow(() -> {
                    // AC-08: log failed token refresh
                    auditLogService.logAuthEvent(
                            AuthActionType.TOKEN_REFRESH_FAILED, "ANONYMOUS", null,
                            null, "JWT", "FAILED", ctx);
                    return new BadCredentialsException("Invalid or expired refresh token");
                });

        User user = refreshToken.getUser();

        // ROTATION: Revoke the old refresh token
        refreshTokenService.revokeRefreshToken(refreshTokenString);
        log.info("Old refresh token revoked for rotation: {}", user.getUsername());

        // Load user details and generate new access token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newAccessToken = jwtTokenUtil.generateAccessToken(userDetails);

        // Generate NEW refresh token
        String deviceInfo = buildDeviceInfo(ctx);
        String newRefreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

        // AC-07: log successful token refresh
        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_REFRESH_SUCCESS,
                String.valueOf(user.getId()),
                String.valueOf(user.getId()),
                user.getUsername(), "JWT", "SUCCESS", ctx);

        log.info("Access token refreshed and rotated for user: {}", user.getUsername());

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    /**
     * Logout user by revoking refresh token.
     *
     * @param refreshToken Refresh token to revoke
     * @param actor        Username of the authenticated user (from JWT principal)
     * @param ctx          Per-request network context
     */
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

    /**
     * Logout user from all devices.
     *
     * @param userId User ID
     * @param actor  Username of the authenticated user (from JWT principal)
     * @param ctx    Per-request network context
     */
    @Transactional
    public void logoutAllDevices(Long userId, String actor, RequestContext ctx) {
        log.debug("Logout all devices for user ID: {}", userId);
        refreshTokenService.revokeAllUserTokens(userId);
        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_REVOKED, actor, String.valueOf(userId),
                actor, "JWT", "SUCCESS", ctx);
        log.info("User logged out from all devices: {}", userId);
    }

    /**
     * Handle failed login attempt
     * Increments failed attempts counter and locks account if threshold exceeded
     */
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

    /**
     * Derives a legacy deviceInfo string from a RequestContext
     * (used by RefreshTokenService.createRefreshToken which still takes a String).
     */
    private String buildDeviceInfo(RequestContext ctx) {
        if (ctx == null) return "Unknown";
        String ua = ctx.getUserAgent() != null ? ctx.getUserAgent() : "Unknown";
        String ip = ctx.getIpAddress() != null ? ctx.getIpAddress() : "Unknown";
        return ua + " | IP: " + ip;
    }

    /**
     * Get user by username
     *
     * @param username Username to search for
     * @return User object
     */
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("User not found: " + username));
    }

    /**
     * Build authentication response with user info and tokens
     */
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
