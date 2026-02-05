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

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    /**
     * Authenticate user and return JWT tokens
     *
     * @param request    Login request with username and password
     * @param deviceInfo Device information (User-Agent, IP, etc.)
     * @return Authentication response with access and refresh tokens
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        log.debug("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        // Check if account is locked
        if (user.isAccountLocked()) {
            log.warn("Login attempt for locked account: {}", request.getUsername());
            throw new LockedException(
                    "Account is locked due to multiple failed login attempts. Please try again later.");
        }

        try {
            // Authenticate with Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));

            // Authentication successful - reset failed attempts
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
            String refreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

            log.info("Login successful for user: {}", request.getUsername());

            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            // Handle failed login attempt
            handleFailedLoginAttempt(user);
            throw new BadCredentialsException("Invalid username or password");
        } catch (DisabledException e) {
            log.warn("Login attempt for disabled account: {}", request.getUsername());
            throw new DisabledException("Account is disabled");
        }
    }

    /**
     * Refresh access token using refresh token
     *
     * @param refreshTokenString Refresh token
     * @param deviceInfo         Device information (User-Agent, IP, etc.)
     * @return New authentication response with new access token and new refresh
     *         token
     */
    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenString, String deviceInfo) {
        log.debug("Refreshing access token");

        // Validate refresh token
        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenString)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        User user = refreshToken.getUser();

        // ROTATION: Revoke the old refresh token
        refreshTokenService.revokeRefreshToken(refreshTokenString);
        log.info("Old refresh token revoked for rotation: {}", user.getUsername());

        // Load user details and generate new access token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String newAccessToken = jwtTokenUtil.generateAccessToken(userDetails);

        // Generate NEW refresh token
        String newRefreshToken = refreshTokenService.createRefreshToken(user, deviceInfo);

        log.info("Access token refreshed and rotated for user: {}", user.getUsername());

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    /**
     * Logout user by revoking refresh token
     *
     * @param refreshToken Refresh token to revoke
     */
    @Transactional
    public void logout(String refreshToken) {
        log.debug("Logout request");
        boolean revoked = refreshTokenService.revokeRefreshToken(refreshToken);
        if (revoked) {
            log.info("User logged out successfully");
        } else {
            log.warn("Logout failed: token not found");
        }
    }

    /**
     * Logout user from all devices
     *
     * @param userId User ID
     */
    @Transactional
    public void logoutAllDevices(Long userId) {
        log.debug("Logout all devices for user ID: {}", userId);
        refreshTokenService.revokeAllUserTokens(userId);
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
