package com.company.ems.backend.common.audit;

import com.company.ems.backend.auditlog.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.Instant;

import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auth.security.CustomUserPrincipal;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    private final AuditLogService auditLogService;

    public void logAuthFailure(HttpServletRequest request) {
        log.warn("[AUDIT][AUTH_FAILURE] timestamp={} ip={} path={} traceId={}",
                Instant.now(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuthActionType.LOGIN_FAILED,
                "ANONYMOUS", null, null, "JWT", "FAILED",
                toCtx(request));
    }

    public void logTokenExpired(HttpServletRequest request) {
        log.warn("[AUDIT][TOKEN_EXPIRED] timestamp={} user={} ip={} path={} traceId={}",
                Instant.now(), username(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_EXPIRED,
                username(), null, fullName(), "JWT", "FAILED",
                toCtx(request));
    }

    public void logTokenInvalid(HttpServletRequest request) {
        log.warn("[AUDIT][TOKEN_INVALID] timestamp={} ip={} path={} traceId={}",
                Instant.now(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuthActionType.TOKEN_INVALID,
                username(), null, fullName(), "JWT", "FAILED",
                toCtx(request));
    }

    public void logAccessDenied(HttpServletRequest request) {
        log.warn("[AUDIT][ACCESS_DENIED] timestamp={} user={} ip={} path={} traceId={}",
                Instant.now(), username(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuthActionType.ACCESS_DENIED,
                username(), null, fullName(), "JWT", "FAILED",
                toCtx(request));
    }

    private RequestContext toCtx(HttpServletRequest request) {
        return RequestContext.builder()
                .ipAddress(clientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .correlationId(request.getHeader("X-Correlation-Id"))
                .build();
    }

    private String clientIp(HttpServletRequest request) {
        return com.company.ems.backend.common.utils.IpUtils.getClientIpAddress(request);
    }

    private String username() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "ANONYMOUS";
    }

    private String fullName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserPrincipal principal) {
            return principal.getFullName();
        }
        return null;
    }

    private String traceId() {
        String id = MDC.get("traceId");
        return id != null ? id : "n/a";
    }

}