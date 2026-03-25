package com.company.ems.backend.common.utils;

import com.company.ems.backend.auditlog.dto.RequestContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class AuditContextUtils {

    /**
     * Extracts RequestContext (IP, UserAgent, CorrelationID) from the current
     * thread's HTTP request.
     * Returns a default empty context if not running within an HTTP request (e.g.
     * background job).
     */
    public static RequestContext getCurrentRequestContext() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null || attributes.getRequest() == null) {
            return RequestContext.builder()
                    .ipAddress("127.0.0.1")
                    .userAgent("SYSTEM")
                    .clientType("SYSTEM")
                    .build();
        }

        HttpServletRequest request = attributes.getRequest();
        String userAgent = request.getHeader("User-Agent");
        String ip = IpUtils.getClientIpAddress(request);

        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null) {
            correlationId = (String) request.getAttribute("X-Correlation-ID");
            if (correlationId == null) {
                correlationId = java.util.UUID.randomUUID().toString();
                request.setAttribute("X-Correlation-ID", correlationId);
            }
        }

        String clientType = "WEB";
        if (userAgent != null) {
            String ua = userAgent.toLowerCase();
            if (ua.contains("okhttp") || ua.contains("android") || ua.contains("ios") ||
                    ua.contains("dart") || ua.contains("flutter")) {
                clientType = "MOBILE";
            } else if (ua.contains("python") || ua.contains("java/") || ua.contains("go-http") ||
                    ua.contains("curl") || ua.contains("postman") || ua.contains("axios")) {
                clientType = "API";
            }
        }

        return RequestContext.builder()
                .ipAddress(ip)
                .userAgent(userAgent)
                .clientType(clientType)
                .correlationId(correlationId)
                .build();
    }
}
