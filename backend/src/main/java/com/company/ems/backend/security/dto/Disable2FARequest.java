package com.company.ems.backend.security.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Disable2FARequest {

    @NotBlank(message = "Password or verification code is required")
    private String password;

    private String verificationCode;
}
