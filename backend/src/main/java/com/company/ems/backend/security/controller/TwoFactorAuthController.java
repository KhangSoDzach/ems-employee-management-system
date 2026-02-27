package com.company.ems.backend.security.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.security.dto.Disable2FARequest;
import com.company.ems.backend.security.dto.TwoFactorAuthResponse;
import com.company.ems.backend.security.dto.Verify2FARequest;
import com.company.ems.backend.security.service.TwoFactorAuthService;
import com.company.ems.backend.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Two-Factor Authentication
 * Handles 2FA setup, verification, and disable operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/2fa")
@RequiredArgsConstructor
@Tag(name = "Two-Factor Authentication", description = "APIs for 2FA operations")
public class TwoFactorAuthController {

    private final TwoFactorAuthService twoFactorAuthService;
    @PostMapping("/setup")
    @Operation(
            summary = "Setup 2FA",
            description = "Initiate 2FA setup. Generates secret key and QR code. Scan QR code with Google Authenticator or Authy.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<ApiResponse<TwoFactorAuthResponse>> setup2FA(
            Authentication authentication
    ) {
        String username = authentication.getName();
        User user = null;
        log.info("2FA setup request received for user: {}", username);

        TwoFactorAuthResponse response = twoFactorAuthService.setup2FA(username);

        return ResponseEntity.ok(
                ApiResponse.<TwoFactorAuthResponse>builder()
                        .success(true)
                        .message("2FA setup initiated. Scan QR code and verify to complete.")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/verify")
    @Operation(
            summary = "Verify and enable 2FA",
            description = "Verify TOTP code from authenticator app and enable 2FA. Returns recovery codes - save them securely!",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<ApiResponse<TwoFactorAuthResponse>> verify2FA(
            Authentication authentication,
            @Valid @RequestBody Verify2FARequest request
    ) {
        String username = authentication.getName();
        log.info("2FA verification request received for user: {}", username);

        TwoFactorAuthResponse response = twoFactorAuthService.verify2FA(username, request);

        return ResponseEntity.ok(
                ApiResponse.<TwoFactorAuthResponse>builder()
                        .success(true)
                        .message("2FA enabled successfully. Save your recovery codes!")
                        .data(response)
                        .build()
        );
    }

    @PostMapping("/disable")
    @Operation(
            summary = "Disable 2FA",
            description = "Disable 2FA for current user. Requires password or TOTP code verification. Email notification will be sent.",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<ApiResponse<TwoFactorAuthResponse>> disable2FA(
            Authentication authentication,
            @Valid @RequestBody Disable2FARequest request
    ) {
        String username = authentication.getName();
        log.info("2FA disable request received for user: {}", username);

        TwoFactorAuthResponse response = twoFactorAuthService.disable2FA(username, request);

        return ResponseEntity.ok(
                ApiResponse.<TwoFactorAuthResponse>builder()
                        .success(true)
                        .message("2FA disabled successfully")
                        .data(response)
                        .build()
        );
    }
    @GetMapping("/status")
    @Operation(
            summary = "Get 2FA status",
            description = "Check if 2FA is enabled for current user",
            security = @SecurityRequirement(name = "Bearer Authentication")
    )
    public ResponseEntity<ApiResponse<Boolean>> get2FAStatus(
            Authentication authentication
    ) {
        String username = authentication.getName();
        boolean enabled = twoFactorAuthService.is2FAEnabled(username);

        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .success(true)
                        .message(enabled ? "2FA is enabled" : "2FA is disabled")
                        .data(enabled)
                        .build()
        );
    }
}
