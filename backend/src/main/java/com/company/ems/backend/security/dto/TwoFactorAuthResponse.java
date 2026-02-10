package com.company.ems.backend.security.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for 2FA operations
 * Contains secret key, QR code, and recovery codes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorAuthResponse {

    private String message;
    private Boolean enabled;
    private String secret;
    private String qrCode;
    private List<String> recoveryCodes;
}
