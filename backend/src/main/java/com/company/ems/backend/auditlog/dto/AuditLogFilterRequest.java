package com.company.ems.backend.auditlog.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuditActionType;

import lombok.Builder;
import lombok.Value;

/**
 * Filter criteria for querying the Audit Log.
 * All fields are optional – null means "no filter".
 */
@Value
@Builder
public class AuditLogFilterRequest {

    /** e.g. "AUTHENTICATION" – defaults to AUTHENTICATION on the controller if absent. */
    String entityType;

    /** Specific action to filter on. */
    AuditActionType actionType;

    /** Partial match on actor (user_id). */
    String actor;

    /** Partial match on identifier_attempted (email / username). */
    String identifierAttempted;

    /** Exact IP address filter. */
    String ipAddress;

    /** Start of time range (inclusive). */
    LocalDateTime from;

    /** End of time range (inclusive). */
    LocalDateTime to;

    /** Page number (0-based). */
    @Builder.Default
    int page = 0;

    /** Page size. */
    @Builder.Default
    int size = 20;
}
