package com.company.ems.backend.auth.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.company.ems.backend.auth.config.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility class for JWT token operations
 * Handles token generation, validation, and claims extraction
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenUtil {

    private final JwtProperties jwtProperties;

    /**
     * Generate access token for user
     *
     * @param userDetails User details
     * @return JWT access token
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername(), jwtProperties.getExpirationMs(),
                jwtProperties.getSecret());
    }

    /**
     * Generate refresh token for user
     *
     * @param userId User ID
     * @return JWT refresh token
     */
    public String generateRefreshToken(Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, userId.toString(), jwtProperties.getRefreshExpirationMs(),
                jwtProperties.getRefreshSecret());
    }

    /**
     * Create JWT token with given claims and subject
     */
    private String createToken(Map<String, Object> claims, String subject, Long expiration, String secret) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .issuer(jwtProperties.getIssuer())
                .audience().add(jwtProperties.getAudience()).and()
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    /**
     * Validate access token
     *
     * @param token       JWT token
     * @param userDetails User details
     * @return true if token is valid
     */
    public boolean validateAccessToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            log.error("Token validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate refresh token
     *
     * @param token Refresh token
     * @return true if token is valid
     */
    public boolean validateRefreshToken(String token) {
        try {
            extractAllClaims(token, jwtProperties.getRefreshSecret());
            return !isTokenExpired(token, jwtProperties.getRefreshSecret());
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extract username from access token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract user ID from refresh token
     */
    public Long extractUserIdFromRefreshToken(String token) {
        Claims claims = extractAllClaims(token, jwtProperties.getRefreshSecret());
        return claims.get("userId", Long.class);
    }

    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim from access token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token, jwtProperties.getSecret());
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from token
     */
    private Claims extractAllClaims(String token, String secret) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if access token is expired
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Check if token is expired with custom secret
     */
    private boolean isTokenExpired(String token, String secret) {
        Claims claims = extractAllClaims(token, secret);
        return claims.getExpiration().before(new Date());
    }

    /**
     * Hash token using SHA-256 for secure storage
     *
     * @param token Token to hash
     * @return Base64 encoded hash
     */
    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
