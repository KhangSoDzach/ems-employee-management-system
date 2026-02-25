package com.company.ems.backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.dto.RefreshTokenRequest;
import com.company.ems.backend.auth.service.AuthenticationService;
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
