package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.SsoRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    /**
     * SSO Authentication (Google, Microsoft, etc.)
     * POST /api/v1/auth/sso
     */
    @PostMapping("/sso")
    public ResponseEntity<ApiResponse<AuthResponse>> ssoAuthentication(
            @Valid @RequestBody SsoRequest request) {
        // TODO: Implement SSO authentication service
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", null));
    }
}
