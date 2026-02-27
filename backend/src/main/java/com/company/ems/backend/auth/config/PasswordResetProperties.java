package com.company.ems.backend.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Configuration properties for the Forgot Password / OTP reset flow.
 * Maps to app.password-reset.* in application.yaml.
 */
@Configuration
@ConfigurationProperties(prefix = "app.password-reset")
@Getter
@Setter
public class PasswordResetProperties {

    /**
     * How long an OTP is valid (in minutes).
     * Must match the frontend countdown timer (default 5 minutes).
     */
    private int otpExpiryMinutes = 5;

    /**
     * Minimum seconds between OTP resend requests for the same email.
     * Prevents spam / brute-force OTP generation.
     */
    private int resendCooldownSeconds = 60;
}
