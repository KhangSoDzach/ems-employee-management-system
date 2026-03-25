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

import com.company.ems.backend.auditlog.enums.AuditActionType;
import com.company.ems.backend.auditlog.dto.RequestContext;

@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    private final AuditLogService auditLogService;
    private static final java.util.Map<String, Long> logoutCache = new java.util.concurrent.ConcurrentHashMap<>();

    public void registerLogout(HttpServletRequest request) {
        if (request != null) {
            String ip = clientIp(request);
            logoutCache.put(ip, System.currentTimeMillis());
        }
    }

    private boolean isPostLogout(HttpServletRequest request) {
        String ip = clientIp(request);
        Long lastLogout = logoutCache.get(ip);
        if (lastLogout != null && (System.currentTimeMillis() - lastLogout) < 3000) {
            return true;
        }
        return false;
    }

    public void logAuthFailure(HttpServletRequest request) {
        if (isPostLogout(request))
            return;

        log.warn("[AUDIT][AUTH_FAILURE] timestamp={} ip={} path={} traceId={}",
                Instant.now(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuditActionType.AUTH_LOGIN_FAILED,
                "ANONYMOUS", null, null, "JWT", "INVALID_CREDENTIAL",
                toCtx(request));
    }

    public void logTokenExpired(HttpServletRequest request) {
        if (isPostLogout(request))
            return;

        log.warn("[AUDIT][TOKEN_EXPIRED] timestamp={} user={} ip={} path={} traceId={}",
                Instant.now(), username(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuditActionType.AUTH_TOKEN_EXPIRED,
                username(), username(), null, null, null,
                toCtx(request));
    }

    public void logTokenInvalid(HttpServletRequest request) {
        if (isPostLogout(request))
            return;

        log.warn("[AUDIT][TOKEN_INVALID] timestamp={} ip={} path={} traceId={}",
                Instant.now(), clientIp(request),
                request.getRequestURI(), traceId());

        auditLogService.logAuthEvent(
                AuditActionType.AUTH_TOKEN_INVALID,
                username(), username(), null, null, null,
                toCtx(request));
    }

    public void logAccessDenied(HttpServletRequest request) {
        if (isPostLogout(request))
            return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())
                || "anonymous".equalsIgnoreCase(auth.getName())) {
            // FR-LOG-REFINE-001: KHÔNG log ACCESS_DENIED khi token invalid / expired hoặc
            // anonymous request
            return;
        }

        log.warn("[AUDIT][ACCESS_DENIED] timestamp={} user={} ip={} path={} traceId={}",
                Instant.now(), username(), clientIp(request),
                request.getRequestURI(), traceId());

        String scope = "UNKNOWN";
        if (auth != null
                && auth.getPrincipal() instanceof com.company.ems.backend.auth.security.CustomUserPrincipal principal) {
            java.util.Set<com.company.ems.backend.user.enums.DataScope> scopes = principal.getDataScopes();
            if (!scopes.isEmpty()) {
                scope = scopes.iterator().next().name();
            }
        }

        auditLogService.logAuthorizationEvent(
                AuditActionType.SECURITY_ACCESS_DENIED,
                username(),
                request.getRequestURI(),
                "INSUFFICIENT_PERMISSION",
                scope,
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
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "anonymous";
    }

    private String traceId() {
        String id = MDC.get("traceId");
        return id != null ? id : "n/a";
    }

}