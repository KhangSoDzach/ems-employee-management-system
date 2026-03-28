package com.company.ems.backend.auditlog.dto;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.EventType;
import com.company.ems.backend.auditlog.enums.ResourceType;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardized read-only response for Audit Log records.
 * Optimized for frontend consumption and standardized naming.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {

    private Long id;
    private ResourceType resource;
    private EventType eventType;
    private AuditAction action;
    private String targetId;
    private String identifier;
    private String actor;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private String clientType;
    private String correlationId;
    private LocalDateTime createdAt;

    private TargetDetail target;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetDetail {
        private String id;
        private String name;
        private String type; // Optional: e.g. EMPLOYEE, ASSET
    }
}
