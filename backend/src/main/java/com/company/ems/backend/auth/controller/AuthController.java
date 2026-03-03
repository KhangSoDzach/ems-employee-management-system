package com.company.ems.backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.ForgotPasswordRequest;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.dto.RefreshTokenRequest;
import com.company.ems.backend.auth.dto.ResetPasswordRequest;
import com.company.ems.backend.auth.service.AuthenticationService;
import com.company.ems.backend.auth.service.PasswordResetService;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.user.entity.User;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST Controller for authentication operations
 * Handles login, token refresh, and logout
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

        private final AuthenticationService authenticationService;
        private final PasswordResetService passwordResetService;

        /**
         * User login endpoint
         * POST /api/v1/auth/login
         *
         * @param request     Login request with username and password
         * @param httpRequest HTTP request for extracting device info
         * @return Authentication response with access and refresh tokens
         */
        @PostMapping("/login")
        @Operation(summary = "User login", description = "Authenticate user and return JWT tokens")
        public ResponseEntity<ApiResponse<AuthResponse>> login(
                        @Valid @RequestBody LoginRequest request,
                        HttpServletRequest httpRequest) {

                String deviceInfo = extractDeviceInfo(httpRequest);
                AuthResponse authResponse = authenticationService.login(request, deviceInfo);

                return ResponseEntity.ok(
                                ApiResponse.success("Login successful", authResponse));
        }

        /**
         * Refresh access token endpoint
         * POST /api/v1/auth/refresh
         *
         * @param request Refresh token request
         * @return New access token
         */
        @PostMapping("/refresh")
        @Operation(summary = "Refresh access token", description = "Get a new access token using refresh token")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                        @Valid @RequestBody RefreshTokenRequest request,
                        HttpServletRequest httpRequest) {

                String deviceInfo = extractDeviceInfo(httpRequest);
                AuthResponse authResponse = authenticationService.refreshAccessToken(request.getRefreshToken(),
                                deviceInfo);

                return ResponseEntity.ok(
                                ApiResponse.success("Token refreshed successfully", authResponse));
        }

        /**
         * Logout endpoint (revoke refresh token)
         * POST /api/v1/auth/logout
         *
         * @param request Refresh token to revoke
         * @return Success message
         */
        @PostMapping("/logout")
        @Operation(summary = "Logout", description = "Revoke refresh token and logout user")
        public ResponseEntity<ApiResponse<Void>> logout(
                        @Valid @RequestBody RefreshTokenRequest request) {

                authenticationService.logout(request.getRefreshToken());

                return ResponseEntity.ok(
                                ApiResponse.success("Logout successful", null));
        }

        /**
         * Logout from all devices
         * POST /api/v1/auth/logout-all
         *
         * @param userDetails Currently authenticated user
         * @return Success message
         */
        @PostMapping("/logout-all")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Logout from all devices", description = "Revoke all refresh tokens for the user")
        public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
                        @AuthenticationPrincipal UserDetails userDetails) {

                // Get user from repository to get the actual ID
                User user = authenticationService.getUserByUsername(userDetails.getUsername());
                authenticationService.logoutAllDevices(user.getId());

                return ResponseEntity.ok(
                                ApiResponse.success("Logged out from all devices", null));
        }

        /**
         * Initiate password reset – send 6-digit OTP to user's email.
         * POST /api/v1/auth/forgot-password
         *
         * Always returns 200 regardless of whether the email exists (anti-enumeration).
         *
         * @param request contains the user's email address
         * @return generic success message
         */
        @PostMapping("/forgot-password")
        @Operation(summary = "Forgot password – request OTP", description = "Sends a 6-digit OTP to the given email. Always returns 200 to prevent email enumeration.")
        public ResponseEntity<ApiResponse<Void>> forgotPassword(
                        @Valid @RequestBody ForgotPasswordRequest request) {

                passwordResetService.initiatePasswordReset(request.getEmail());

                return ResponseEntity.ok(
                                ApiResponse.success("Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.", null));
        }

        /**
         * Verifies the OTP and sets the new password atomically.
         *
         * @param request contains email, 6-digit OTP, and new password
         * @return success message
         */
        @PostMapping("/reset-password")
        @Operation(summary = "Reset password with OTP", description = "Verifies the OTP received by email and resets the password in one call. OTP is valid for 5 minutes.")
        public ResponseEntity<ApiResponse<Void>> resetPassword(
                        @Valid @RequestBody ResetPasswordRequest request) {

                passwordResetService.resetPassword(
                                request.getEmail(),
                                request.getOtp(),
                                request.getNewPassword());

                return ResponseEntity.ok(
                                ApiResponse.success("Mật khẩu đã được đặt lại thành công.", null));
        }

        /**
         * Extract device information from HTTP request
         *
         * @param request HTTP request
         * @return Device info string (User-Agent + IP)
         */
        private String extractDeviceInfo(HttpServletRequest request) {
                String userAgent = request.getHeader("User-Agent");
                String ip = request.getRemoteAddr();
                return String.format("%s | IP: %s", userAgent != null ? userAgent : "Unknown", ip);
        }

        /**
         * Get current authenticated user details
         * GET /api/v1/auth/me
         *
         * @param userDetails Currently authenticated user
         * @return User details
         */
        @GetMapping("/me")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Get current user", description = "Returns the authenticated user's profile info")
        public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(
                        @AuthenticationPrincipal UserDetails userDetails) {

                User user = authenticationService.getUserByUsername(userDetails.getUsername());

                AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                // firstName & lastName belong to Employee entity, not User – returning null for
                                // now
                                .firstName(null)
                                .lastName(null)
                                .roles(user.getRoles().stream()
                                                .map(role -> role.getName())
                                                .toList())
                                .build();

                return ResponseEntity.ok(ApiResponse.success("Current user info", userInfo));
        }
}
