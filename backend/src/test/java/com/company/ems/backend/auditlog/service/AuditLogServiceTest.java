package com.company.ems.backend.auditlog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.company.ems.backend.auditlog.entity.AuditLog;
import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.AuditResource;
import com.company.ems.backend.auditlog.repository.AuditLogRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("java:S5960")
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    @SuppressWarnings("null")
    void logEventUsesCurrentHttpRequestMetadataWhenContextIsNull() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");
            request.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            request.addHeader("X-Correlation-ID", "corr-123");
            request.setRemoteAddr("127.0.0.1");
            RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

            auditLogService.logEvent(
                    AuditResource.ASSET,
                    AuditAction.CREATE,
                    "john.doe",
                    "INC-001",
                    "John Doe",
                    new AuditLogService.AuditValues(null, "{\"result\":\"SUCCESS\"}"),
                    null);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(captor.capture());
            AuditLog saved = captor.getValue();

            assertEquals("203.0.113.10", saved.getIpAddress());
            assertEquals("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", saved.getUserAgent());
            assertEquals("corr-123", saved.getCorrelationId());
            assertEquals("WEB", saved.getClientType());
            assertEquals("John Doe", saved.getIdentifier());
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    @SuppressWarnings("null")
    void logEventKeepsBestEffortBehaviorWhenNoRequestContextAvailable() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        try {
            RequestContextHolder.resetRequestAttributes();

            auditLogService.logEvent(
                    AuditResource.ASSET,
                    AuditAction.UPDATE,
                    "jane.doe",
                    "INC-002",
                    "Jane Doe",
                    new AuditLogService.AuditValues(null, "REJECTED"),
                    null);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(captor.capture());
            AuditLog saved = captor.getValue();

            assertNull(saved.getIpAddress());
            assertNull(saved.getUserAgent());
            assertNull(saved.getCorrelationId());
            assertEquals("WEB", saved.getClientType());
            assertEquals("Jane Doe", saved.getIdentifier());
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }
}
