package com.company.ems.backend.audit.service;

import com.company.ems.backend.audit.dto.AuditLogDetailResponse;
import com.company.ems.backend.audit.dto.AuditLogFilterRequest;
import com.company.ems.backend.audit.dto.AuditLogSummaryResponse;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import com.company.ems.backend.common.dto.PageResponse;

public interface AuditLogService {

    void record(
            Long             userId,
            String           identifierAttempted,
            AuditActionType  actionType,
            AuditResult      result,
            LoginMethod      loginMethod,
            String           ipAddress,
            String           userAgent,
            String           clientType,
            String           correlationId,
            String           message);

    PageResponse<AuditLogSummaryResponse> queryLogs(AuditLogFilterRequest filter);

    AuditLogDetailResponse getLogById(Long id);
}