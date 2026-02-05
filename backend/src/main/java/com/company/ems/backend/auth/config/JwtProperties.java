package com.company.ems.backend.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

/**
 * Configuration properties for JWT authentication
 * Maps to jwt.* properties in application.yml
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * Secret key for signing access tokens
     * Should be at least 256 bits (32 characters)
     */
    private String secret;

    /**
     * Secret key for signing refresh tokens
     * Should be different from access token secret
     */
    private String refreshSecret;

    /**
     * Access token expiration time in milliseconds
     * Default: 30 minutes (1800000 ms)
     */
    private Long expirationMs = 1800000L;

    /**
     * Refresh token expiration time in milliseconds
     * Default: 7 days (604800000 ms)
     */
    private Long refreshExpirationMs = 604800000L;

    /**
     * JWT issuer
     * Identifies who issued the token
     */
    private String issuer = "ems-backend";

    /**
     * JWT audience
     * Identifies who the token is intended for
     */
    private String audience = "ems-app";
}
