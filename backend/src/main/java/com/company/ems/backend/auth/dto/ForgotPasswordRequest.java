package com.company.ems.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request DTO for initiating a password reset.
 * POST /api/v1/auth/forgot-password
 */
@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Request to send a password-reset OTP to the given email address")
public class ForgotPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "The user's registered email address", example = "admin@company.com")
    private String email;
}
