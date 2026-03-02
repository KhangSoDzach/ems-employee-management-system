package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization endpoints")
public class AuthController {

        private final AuthenticationService authenticationService;

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

        @PostMapping("/logout")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Logout")
        public ResponseEntity<ApiResponse<Void>> logout(
                @Valid @RequestBody RefreshTokenRequest request,
                HttpServletRequest httpRequest,
                @AuthenticationPrincipal CustomUserPrincipal principal) {

                Long  userId   = principal != null ? principal.getUserId()   : null;
                String username = principal != null ? principal.getUsername() : null;

                authenticationService.logout(
                        request.getRefreshToken(),
                        extractDeviceInfo(httpRequest),
                        userId, username);

                return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
        }

        @PostMapping("/logout-all")
        @SecurityRequirement(name = "bearer-jwt")
        @Operation(summary = "Logout from all devices", description = "Revoke all refresh tokens for the user")
        public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
                HttpServletRequest httpRequest,
                @AuthenticationPrincipal CustomUserPrincipal principal) {

                authenticationService.logoutAllDevices(
                        principal.getUserId(),
                        principal.getUsername(),
                        extractDeviceInfo(httpRequest));

                return ResponseEntity.ok(ApiResponse.success("Logged out from all devices", null));
        }

        private String extractDeviceInfo(HttpServletRequest request) {
                String ua = request.getHeader("User-Agent");
                String ip = getClientIp(request);
                return String.format("%s | IP: %s", ua != null ? ua : "Unknown", ip);
        }

        private String getClientIp(HttpServletRequest request) {
                String[] headers = {
                        "X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP",
                        "WL-Proxy-Client-IP", "HTTP_X_FORWARDED_FOR"
                };
                for (String header : headers) {
                        String ip = request.getHeader(header);
                        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                                return ip.split(",")[0].trim();
                        }
                }
                return request.getRemoteAddr();
        }
}
