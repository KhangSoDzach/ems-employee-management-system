package com.company.ems.backend.audit.dto;

import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value @Builder
public class AuditLogSummaryResponse {
    Long            id;
    Long            userId;
    String          identifierAttempted;
    AuditActionType actionType;
    AuditResult     result;
    String          loginMethod;
    String          ipAddress;
    String          message;
    LocalDateTime   createdAt;
}