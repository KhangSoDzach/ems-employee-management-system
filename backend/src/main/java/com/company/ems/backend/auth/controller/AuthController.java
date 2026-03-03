package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
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

        @PostMapping("/login")
        @Operation(summary = "User login")
        public ResponseEntity<ApiResponse<AuthResponse>> login(
                @Valid @RequestBody LoginRequest request,
                HttpServletRequest httpRequest) {
                AuthResponse authResponse = authenticationService.login(request, extractDeviceInfo(httpRequest));
                return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
        }

        @PostMapping("/refresh")
        @Operation(summary = "Refresh access token")
        public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
                @Valid @RequestBody RefreshTokenRequest request,
                HttpServletRequest httpRequest) {
                AuthResponse authResponse = authenticationService.refreshAccessToken(
                        request.getRefreshToken(), extractDeviceInfo(httpRequest));
                return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
        }

        @PostMapping("/logout")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Logout")
        public ResponseEntity<ApiResponse<Void>> logout(
                @Valid @RequestBody RefreshTokenRequest request,
                HttpServletRequest httpRequest,
                @AuthenticationPrincipal CustomUserPrincipal principal) {

                Long   userId   = principal != null ? principal.getUserId()   : null;
                String username = principal != null ? principal.getUsername() : null;

                authenticationService.logout(
                        request.getRefreshToken(),
                        extractDeviceInfo(httpRequest),
                        userId,
                        username);

                return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
        }

        @PostMapping("/logout-all")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Logout from all devices")
        public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
                HttpServletRequest httpRequest,
                @AuthenticationPrincipal CustomUserPrincipal principal) {

                authenticationService.logoutAllDevices(
                        principal.getUserId(),
                        principal.getUsername(),
                        extractDeviceInfo(httpRequest));

                return ResponseEntity.ok(ApiResponse.success("Logged out from all devices", null));
        }

        @PostMapping("/forgot-password")
        @Operation(summary = "Forgot password – request OTP")
        public ResponseEntity<ApiResponse<Void>> forgotPassword(
                @Valid @RequestBody ForgotPasswordRequest request) {
                passwordResetService.initiatePasswordReset(request.getEmail());
                return ResponseEntity.ok(ApiResponse.success(
                        "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi.", null));
        }

        @PostMapping("/reset-password")
        @Operation(summary = "Reset password with OTP")
        public ResponseEntity<ApiResponse<Void>> resetPassword(
                @Valid @RequestBody ResetPasswordRequest request) {
                passwordResetService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
                return ResponseEntity.ok(ApiResponse.success("Mật khẩu đã được đặt lại thành công.", null));
        }

        @GetMapping("/me")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Get current user")
        public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(
                @AuthenticationPrincipal UserDetails userDetails) {
                User user = authenticationService.getUserByUsername(userDetails.getUsername());
                AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .firstName(null)
                        .lastName(null)
                        .roles(user.getRoles().stream().map(role -> role.getName()).toList())
                        .build();
                return ResponseEntity.ok(ApiResponse.success("Current user info", userInfo));
        }

        private String extractDeviceInfo(HttpServletRequest request) {
                String userAgent = request.getHeader("User-Agent");
                String ip        = request.getRemoteAddr();
                return String.format("%s | IP: %s", userAgent != null ? userAgent : "Unknown", ip);
        }
}
