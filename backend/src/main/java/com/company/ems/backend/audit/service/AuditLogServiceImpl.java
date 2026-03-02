package com.company.ems.backend.audit.service;

import com.company.ems.backend.audit.dto.AuditLogDetailResponse;
import com.company.ems.backend.audit.dto.AuditLogFilterRequest;
import com.company.ems.backend.audit.dto.AuditLogSummaryResponse;
import com.company.ems.backend.audit.entity.AuditLog;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import com.company.ems.backend.audit.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.company.ems.backend.audit.event.AuditLogEvent;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async("auditExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleAuditEvent(AuditLogEvent event) {
        record(
                event.getUserId(),
                event.getIdentifierAttempted(),
                event.getActionType(),
                event.getResult(),
                event.getLoginMethod(),
                event.getIpAddress(),
                event.getUserAgent(),
                event.getClientType(),
                event.getCorrelationId(),
                event.getMessage()
        );
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            Long userId,
            String identifierAttempted,
            AuditActionType actionType,
            AuditResult result,
            LoginMethod loginMethod,
            String ipAddress,
            String userAgent,
            String clientType,
            String correlationId,
            String message) {
        try {
            AuditLog log = AuditLog.builder()
                    .userId(userId)
                    .identifierAttempted(truncate(identifierAttempted, 255))
                    .actionType(actionType)
                    .result(result)
                    .loginMethod(loginMethod != null ? loginMethod : LoginMethod.JWT)
                    .ipAddress(truncate(ipAddress, 45))
                    .userAgent(truncate(userAgent, 500))
                    .clientType(truncate(clientType, 50))
                    .correlationId(truncate(correlationId, 100))
                    .message(truncate(sanitize(message), 500))
                    .build();

            auditLogRepository.save(log);

            log().info(
                    "AUDIT_LOG | action=[{}] | result=[{}] | userId=[{}] | identifier=[{}] | ip=[{}]",
                    actionType, result, userId, mask(identifierAttempted), ipAddress);

        } catch (Exception ex) {
            log().error("AUDIT_WRITE_FAILED: action=[{}] userId=[{}] error=[{}]",
                    actionType, userId, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogSummaryResponse> queryLogs(AuditLogFilterRequest filter) {
        PageRequest pageable = PageRequest.of(
                filter.getPage(), filter.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));  // Luôn sort DESC created_at

        Page<AuditLog> page = auditLogRepository.findWithFilters(
                filter.getUserId(),
                filter.getFromDate(),
                filter.getToDate(),
                filter.getResult(),
                filter.getActionType(),
                pageable);

        List<AuditLogSummaryResponse> content = page.getContent()
                .stream().map(this::toSummary).toList();

        return PageResponse.<AuditLogSummaryResponse>builder()
                .content(content)
                .page(filter.getPage())
                .size(filter.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogDetailResponse getLogById(Long id) {
        AuditLog entity = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog", "id", id));
        return toDetail(entity);
    }
    private AuditLogSummaryResponse toSummary(AuditLog e) {
        return AuditLogSummaryResponse.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .identifierAttempted(e.getIdentifierAttempted())
                .actionType(e.getActionType())
                .result(e.getResult())
                .loginMethod(e.getLoginMethod() != null ? e.getLoginMethod().name() : null)
                .ipAddress(e.getIpAddress())
                .message(e.getMessage())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private AuditLogDetailResponse toDetail(AuditLog e) {
        return AuditLogDetailResponse.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .identifierAttempted(e.getIdentifierAttempted())
                .actionType(e.getActionType())
                .result(e.getResult())
                .loginMethod(e.getLoginMethod() != null ? e.getLoginMethod().name() : null)
                .ipAddress(e.getIpAddress())
                .userAgent(e.getUserAgent())
                .clientType(e.getClientType())
                .correlationId(e.getCorrelationId())
                .message(e.getMessage())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String sanitize(String value) {
        if (value == null) return null;
        return value.replaceAll("[\r\n\t]", " ");
    }

    private String mask(String identifier) {
        if (identifier == null || identifier.length() <= 3) return "***";
        return identifier.charAt(0) + "**" + identifier.substring(3);
    }

    private org.slf4j.Logger log() {
        return org.slf4j.LoggerFactory.getLogger(AuditLogServiceImpl.class);
    }
}