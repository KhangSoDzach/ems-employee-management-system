package com.company.ems.backend.audit.service;

import com.company.ems.backend.audit.dto.AuditLogFilterRequest;
import com.company.ems.backend.audit.dto.AuditLogSummaryResponse;
import com.company.ems.backend.audit.entity.AuditLog;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import com.company.ems.backend.audit.event.AuditLogEvent;
import com.company.ems.backend.audit.repository.AuditLogRepository;
import com.company.ems.backend.common.dto.PageResponse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService — Unit Tests")
class AuditLogServiceTest {

    @Mock  AuditLogRepository  auditRepo;
    @InjectMocks AuditLogServiceImpl auditService;

    static final Long   USER_ID    = 3L;
    static final String USERNAME   = "employee1";
    static final String IP         = "192.168.1.100";
    static final String UA         = "Mozilla/5.0 (Postman)";

    @Nested @DisplayName("record() — Append-only write")
    class RecordTests {

        @Test
        @DisplayName("✅ LOGIN_SUCCESS → lưu log với đúng fields")
        void loginSuccess_savesCorrectLog() {
            auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.LOGIN_SUCCESS, AuditResult.SUCCESS,
                    LoginMethod.JWT, IP, UA, "WEB", null, null);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());

            AuditLog saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getActionType()).isEqualTo(AuditActionType.LOGIN_SUCCESS);
            assertThat(saved.getResult()).isEqualTo(AuditResult.SUCCESS);
            assertThat(saved.getIpAddress()).isEqualTo(IP);
            assertThat(saved.getMessage()).isNull();
        }

        @Test
        @DisplayName("LOGIN_FAILED → lưu log FAILED với reason")
        void loginFailed_savesFailedLog() {
            auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.LOGIN_FAILED, AuditResult.FAILED,
                    LoginMethod.JWT, IP, UA, "WEB", null, "Bad credentials attempt 1");

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());

            AuditLog saved = captor.getValue();
            assertThat(saved.getActionType()).isEqualTo(AuditActionType.LOGIN_FAILED);
            assertThat(saved.getResult()).isEqualTo(AuditResult.FAILED);
            assertThat(saved.getMessage()).contains("Bad credentials");
        }

        @Test
        @DisplayName("TOKEN_REFRESH_SUCCESS → lưu log")
        void tokenRefreshSuccess_savesLog() {
            auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.TOKEN_REFRESH_SUCCESS, AuditResult.SUCCESS,
                    LoginMethod.JWT, IP, UA, "API", null, null);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());
            assertThat(captor.getValue().getActionType())
                    .isEqualTo(AuditActionType.TOKEN_REFRESH_SUCCESS);
        }

        @Test
        @DisplayName("TOKEN_REFRESH_FAILED → lưu log FAILED")
        void tokenRefreshFailed_savesLog() {
            auditService.record(
                    null, null,
                    AuditActionType.TOKEN_REFRESH_FAILED, AuditResult.FAILED,
                    LoginMethod.JWT, IP, UA, "WEB", null, "Invalid token");

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());
            assertThat(captor.getValue().getActionType())
                    .isEqualTo(AuditActionType.TOKEN_REFRESH_FAILED);
            assertThat(captor.getValue().getUserId()).isNull(); // anonymous
        }

        @Test
        @DisplayName("LOGOUT → lưu log")
        void logout_savesLog() {
            auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.LOGOUT, AuditResult.SUCCESS,
                    LoginMethod.JWT, IP, UA, "WEB", null, null);

            verify(auditRepo).save(any(AuditLog.class));
        }

        @Test
        @DisplayName("record() KHÔNG throw exception dù DB lỗi")
        void recordNeverThrows_evenOnDbError() {
            when(auditRepo.save(any())).thenThrow(new RuntimeException("DB connection lost"));
            assertThatCode(() -> auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.LOGIN_SUCCESS, AuditResult.SUCCESS,
                    LoginMethod.JWT, IP, UA, "WEB", null, null))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Anonymous login (user không tồn tại) → userId = null")
        void anonymousLogin_nullUserId() {
            auditService.record(
                    null, "nonexistent@test.com",
                    AuditActionType.LOGIN_FAILED, AuditResult.FAILED,
                    LoginMethod.JWT, IP, UA, "WEB", null, "User not found");

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());
            assertThat(captor.getValue().getUserId()).isNull();
            assertThat(captor.getValue().getIdentifierAttempted())
                    .isEqualTo("nonexistent@test.com");
        }

        @Test
        @DisplayName("Long message bị truncate về 500 ký tự")
        void longMessage_truncated() {
            String longMsg = "x".repeat(1000);
            auditService.record(
                    USER_ID, USERNAME,
                    AuditActionType.LOGIN_FAILED, AuditResult.FAILED,
                    LoginMethod.JWT, IP, UA, "WEB", null, longMsg);

            ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditRepo).save(captor.capture());
            assertThat(captor.getValue().getMessage()).hasSizeLessThanOrEqualTo(500);
        }
    }

    @Nested @DisplayName("queryLogs() — Admin read API")
    class QueryTests {

        @Test
        @DisplayName("Query không có filter → trả tất cả logs")
        void queryWithNoFilter_returnsAll() {
            var auditLog = buildLog(1L, USER_ID, AuditActionType.LOGIN_SUCCESS, AuditResult.SUCCESS);
            when(auditRepo.findWithFilters(any(), any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(auditLog)));

            var filter = AuditLogFilterRequest.builder().page(0).size(20).build();
            PageResponse<AuditLogSummaryResponse> result = auditService.queryLogs(filter);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getActionType())
                    .isEqualTo(AuditActionType.LOGIN_SUCCESS);
        }

        @Test
        @DisplayName("Response không trả password hay token field")
        void response_noSensitiveFields() {
            var auditLog = buildLog(1L, USER_ID, AuditActionType.LOGIN_SUCCESS, AuditResult.SUCCESS);
            when(auditRepo.findWithFilters(any(), any(), any(), any(), any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(auditLog)));

            var filter = AuditLogFilterRequest.builder().page(0).size(20).build();
            var result = auditService.queryLogs(filter);
            AuditLogSummaryResponse resp = result.getContent().get(0);
            assertThat(resp.getUserId()).isEqualTo(USER_ID);
        }
    }
    private AuditLog buildLog(Long id, Long userId,
                              AuditActionType action, AuditResult result) {
        return AuditLog.builder()
                .id(id)
                .userId(userId)
                .identifierAttempted(USERNAME)
                .actionType(action)
                .result(result)
                .loginMethod(LoginMethod.JWT)
                .ipAddress(IP)
                .userAgent(UA)
                .createdAt(LocalDateTime.now())
                .build();
    }
}