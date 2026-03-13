package com.company.ems.backend.auth.controller;

        import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.ForgotPasswordRequest;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.dto.RefreshTokenRequest;
import com.company.ems.backend.auth.dto.ResetPasswordRequest;
import com.company.ems.backend.auth.service.AuthenticationService;
import com.company.ems.backend.auth.service.PasswordResetService;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
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
        private final MessageService messages;

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

                RequestContext ctx = buildRequestContext(httpRequest);
                AuthResponse authResponse = authenticationService.login(request, ctx);

                return ResponseEntity.ok(
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), authResponse));
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

                RequestContext ctx = buildRequestContext(httpRequest);
                AuthResponse authResponse = authenticationService.refreshAccessToken(
                                request.getRefreshToken(), ctx);

                return ResponseEntity.ok(
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), authResponse));
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
                        @Valid @RequestBody RefreshTokenRequest request,
                        @AuthenticationPrincipal UserDetails userDetails,
                        HttpServletRequest httpRequest) {

                String actor = userDetails != null ? userDetails.getUsername() : "ANONYMOUS";
                RequestContext ctx = buildRequestContext(httpRequest);
                authenticationService.logout(request.getRefreshToken(), actor, ctx);

                return ResponseEntity.ok(
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
        }

        /**
         * Logout from all devices
         * POST /api/v1/auth/logout-all
         *
         * @param userDetails Currently authenticated user
         * @return Success message
         */
        @PostMapping("/logout-all")
        @SecurityRequirement(name = "bearerAuth")
        @Operation(summary = "Logout from all devices", description = "Revoke all refresh tokens for the user")
        public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
                        @AuthenticationPrincipal UserDetails userDetails,
                        HttpServletRequest httpRequest) {

                if (userDetails == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_UNAUTHENTICATED)));
                }

                User user = authenticationService.getUserByUsername(userDetails.getUsername());
                RequestContext ctx = buildRequestContext(httpRequest);
                authenticationService.logoutAllDevices(user.getId(), userDetails.getUsername(), ctx);

                return ResponseEntity.ok(
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
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
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
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
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
        }

        /**
         * Change password for the current authenticated user
         * POST /api/v1/auth/change-password
         *
         * @param request Update password request
         * @return Success message
         */
        @PostMapping("/change-password")
        @SecurityRequirement(name = "bearerAuth")
        @Operation(summary = "Change password", description = "Change password for the current authenticated user")
        public ResponseEntity<ApiResponse<Void>> changePassword(
                        @Valid @RequestBody com.company.ems.backend.auth.dto.ChangePasswordRequest request,
                        @AuthenticationPrincipal UserDetails userDetails,
                        HttpServletRequest httpRequest) {

                if (userDetails == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_UNAUTHENTICATED)));
                }

                User user = authenticationService.getUserByUsername(userDetails.getUsername());
                RequestContext ctx = buildRequestContext(httpRequest);

                authenticationService.changePassword(user.getId(), request, ctx);

                return ResponseEntity.ok(
                                ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
        }

        /**
         * Extract device information from HTTP request
         *
         * @param request HTTP request
         * @return Device info string (User-Agent + IP)
         */
        /**
         * Builds a RequestContext from an incoming HTTP request.
         * Respects X-Forwarded-For header for deployments behind a proxy/load-balancer.
         */
        private RequestContext buildRequestContext(HttpServletRequest request) {
                String userAgent = request.getHeader("User-Agent");
                String xff = request.getHeader("X-Forwarded-For");
                String ip = (xff != null && !xff.isBlank())
                                ? xff.split(",")[0].trim()
                                : request.getRemoteAddr();
                String correlationId = request.getHeader("X-Correlation-ID");

                // Determine client type from User-Agent (best-effort heuristic)
                String clientType = "WEB";
                if (userAgent != null) {
                        String ua = userAgent.toLowerCase();
                        if (ua.contains("okhttp") || ua.contains("android") || ua.contains("ios") ||
                                        ua.contains("dart") || ua.contains("flutter")) {
                                clientType = "MOBILE";
                        } else if (ua.contains("python") || ua.contains("java/") || ua.contains("go-http") ||
                                        ua.contains("curl") || ua.contains("postman") || ua.contains("axios")) {
                                clientType = "API";
                        }
                }

                return RequestContext.builder()
                                .ipAddress(ip)
                                .userAgent(userAgent)
                                .clientType(clientType)
                                .correlationId(correlationId)
                                .build();
        }

        /**
         * Get current authenticated user details
         * GET /api/v1/auth/me
         *
         * @param userDetails Currently authenticated user
         * @return User details
         */
        @GetMapping("/me")
        @SecurityRequirement(name = "bearerAuth")
        @Operation(summary = "Get current user", description = "Returns the authenticated user's profile info")
        public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(
                        @AuthenticationPrincipal UserDetails userDetails) {

                if (userDetails == null) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_UNAUTHENTICATED)));
                }

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

                return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), userInfo));
        }
}
