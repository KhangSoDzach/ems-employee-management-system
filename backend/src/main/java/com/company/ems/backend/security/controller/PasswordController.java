package com.company.ems.backend.security.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.security.dto.ChangePasswordRequest;
import com.company.ems.backend.security.service.PasswordService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1/password")
@RequiredArgsConstructor
@Tag(name = "Password Management", description = "APIs for password operations")
public class PasswordController {

    private final PasswordService passwordService;
    @PostMapping("/change")
    @Operation(
            summary = "Change password",
            description = "Change current user password. Requires current password verification. New password must meet strength requirements.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        String username = authentication.getName();
        log.info("Password change request received for user: {}", username);

        passwordService.changePassword(username, request);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Password changed successfully. Please login again with your new password.")
                        .build()
        );
    }
}
