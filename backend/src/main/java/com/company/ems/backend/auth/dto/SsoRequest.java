package com.company.ems.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SsoRequest {
    @NotBlank(message = "Provider is required")
    private String provider; // google, microsoft, etc.

    @NotBlank(message = "Token is required")
    private String token;

    private String redirectUri;
}
