package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.SsoRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "APIs for authentication and authorization")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Operation(summary = "SSO Authentication", description = "Authenticate user via Single Sign-On (Google, Microsoft, etc.)")
    @PostMapping("/sso")
    public ResponseEntity<ApiResponse<AuthResponse>> ssoAuthentication(
            @Valid @RequestBody SsoRequest request) {
        // TODO: Implement SSO authentication service
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", null));
    }
}
