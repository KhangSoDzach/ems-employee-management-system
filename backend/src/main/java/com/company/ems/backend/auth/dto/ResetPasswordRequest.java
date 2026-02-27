package com.company.ems.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request DTO for resetting a password using an OTP.
 * POST /api/v1/auth/reset-password
 */
@Getter
@Setter
@NoArgsConstructor
@Schema(description = "Request to reset a password using the OTP sent via email")
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "The user's registered email address", example = "admin@company.com")
    private String email;

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    @Schema(description = "The 6-digit OTP received by email", example = "482731")
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(min = 8, message = "New password must be at least 8 characters")
    @Schema(description = "The new password to set (min 8 characters)", example = "MyNewP@ss1")
    private String newPassword;
}
