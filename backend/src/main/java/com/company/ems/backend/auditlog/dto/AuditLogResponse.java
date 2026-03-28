package com.company.ems.backend.auditlog.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Value;

/**
 * Read-only response DTO for a single Audit Log record.
 * No passwords, access tokens, or refresh tokens are ever included.
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {

    Long id;
    String entityType;
    String entityId;
    AuthActionType actionType;
    String actor;
    String identifierAttempted;
    String oldValue;
    String newValue;
    String ipAddress;
    String userAgent;
    String clientType;
    String correlationId;
    LocalDateTime createdAt;
}
