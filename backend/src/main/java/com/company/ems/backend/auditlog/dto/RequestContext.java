package com.company.ems.backend.auditlog.dto;

import lombok.Builder;
import lombok.Value;

/**
 * Carries per-request network context needed by AuditLogService.
 * Extracted from HttpServletRequest in the controller layer.
 */
@Value
@Builder
public class RequestContext {

    /** Client IP address (X-Forwarded-For preferred, else remoteAddr). */
    String ipAddress;

    /** HTTP User-Agent header. */
    String userAgent;

    /**
     * Client classification: WEB | MOBILE | API.
     * Defaults to "WEB" when not explicitly provided.
     */
    @Builder.Default
    String clientType = "WEB";

    /** Optional correlation / request tracing ID. */
    String correlationId;
}
