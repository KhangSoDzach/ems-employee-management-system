package com.company.ems.backend.auditlog.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.ResourceType;

import lombok.Builder;
import lombok.Value;

/**
 * Filter criteria for querying the standardized Audit Log.
 * Updated to use specialized ResourceType enum.
 */
@Value
@Builder
public class AuditLogFilterRequest {

    /** Domain resource (e.g. AUTH, EMPLOYEE). */
    ResourceType resource;

    /** Specific action. */
    AuditAction action;

    /** Partial match on actor username. */
    String actor;

    /** Partial match on target identifier (full name). */
    String identifier;

    /** Exact IP address filter. */
    String ipAddress;

    /**
     * Whether to show anonymous logs (e.g. LOGIN_FAILED).
     * Hidden by default in UI per production requirements.
     */
    @Builder.Default
    boolean showAnonymous = false;

    /** Start of time range. */
    LocalDateTime from;

    /** End of time range. */
    LocalDateTime to;

    @Builder.Default
    int page = 0;

    @Builder.Default
    int size = 20;
}
