package com.company.ems.backend.auth.security;

import java.io.IOException;

import com.company.ems.backend.common.constant.AppConstant;
import com.company.ems.backend.common.message.MessageCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.SignatureException;
import org.springframework.lang.NonNull;
import com.company.ems.backend.common.audit.SecurityAuditService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.ems.backend.auth.service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final CustomUserDetailsService userDetailsService;
    private final SecurityAuditService auditService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String jwt = extractJwtFromRequest(request);
        if (!StringUtils.hasText(jwt)) {
            request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_TOKEN_MISSING);
            filterChain.doFilter(request, response);
            return;
        }
        try {
            String username = jwtTokenUtil.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // immediate deny if account is disabled (suspended)
                if (!userDetails.isEnabled()) {
                    log.warn("Disabled/suspended user attempted access: {}", username);
                    request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_ACCOUNT_SUSPENDED);
                    auditService.logAccessDenied(request);
                } else if (jwtTokenUtil.validateAccessToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("User '{}' authenticated successfully", username);
                } else {
                    log.warn("Token validation failed for user: {}", username);
                    request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_TOKEN_INVALID);
                    auditService.logTokenInvalid(request);
                }
            }

        } catch (ExpiredJwtException ex) {
            log.warn("JWT token expired: {}", ex.getMessage());
            request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_TOKEN_EXPIRED);
            auditService.logTokenExpired(request);

        } catch (SignatureException | MalformedJwtException | UnsupportedJwtException ex) {
            log.warn("JWT token invalid [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage());
            request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_TOKEN_INVALID);
            auditService.logTokenInvalid(request);

        } catch (JwtException ex) {
            log.warn("JWT exception: {}", ex.getMessage());
            request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_TOKEN_INVALID);
            auditService.logTokenInvalid(request);

        } catch (Exception ex) {
            log.error("Unexpected error during JWT processing: {}", ex.getMessage());
            request.setAttribute(AppConstant.JWT_ERROR_CODE_ATTR, MessageCode.ERROR_UNAUTHORIZED);
            auditService.logAuthFailure(request);
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
