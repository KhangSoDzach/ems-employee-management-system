package com.company.ems.backend.audit.controller;

import com.company.ems.backend.audit.dto.AuditLogSummaryResponse;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.service.AuditLogService;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.rbac.evaluator.CustomPermissionEvaluator;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.user.enums.DataScope;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuditLogController.class)
@DisplayName("AuditLogController — Integration Tests")
class AuditLogControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean AuditLogService         auditLogService;
    @MockBean JwtTokenUtil              jwtTokenUtil;
    @MockBean CustomUserDetailsService  userDetailsService;
    @MockBean CustomPermissionEvaluator customPermissionEvaluator;

    private CustomUserPrincipal adminPrincipal() {
        return new CustomUserPrincipal(1L, "admin", "pw", true, true, true, true,
                List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("EMPLOYEE_VIEW"),
                        new SimpleGrantedAuthority("AUDIT_VIEW")),
                Set.of(DataScope.ALL));
    }

    private CustomUserPrincipal hrAdminPrincipal() {
        return new CustomUserPrincipal(5L, "hr_admin", "pw", true, true, true, true,
                List.of(
                        new SimpleGrantedAuthority("ROLE_HR_ADMIN"),
                        new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.ALL));
    }

    private CustomUserPrincipal managerPrincipal() {
        return new CustomUserPrincipal(2L, "manager1", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_MANAGER"),
                        new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.TEAM, DataScope.SELF));
    }

    private CustomUserPrincipal employeePrincipal() {
        return new CustomUserPrincipal(3L, "employee1", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"),
                        new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.SELF));
    }

    private PageResponse<AuditLogSummaryResponse> samplePage() {
        var log = AuditLogSummaryResponse.builder()
                .id(1L).userId(3L)
                .identifierAttempted("employee1")
                .actionType(AuditActionType.LOGIN_SUCCESS)
                .result(AuditResult.SUCCESS)
                .loginMethod("JWT")
                .ipAddress("192.168.1.1")
                .createdAt(LocalDateTime.now())
                .build();
        return PageResponse.<AuditLogSummaryResponse>builder()
                .content(List.of(log))
                .page(0).size(20).totalElements(1L).totalPages(1)
                .first(true).last(true).build();
    }
    @Nested @DisplayName("GET /api/v1/admin/audit-logs — List logs")
    class ListLogs {

        @Test
        @DisplayName("ADMIN xem logs → 200")
        void admin_canViewLogs_200() throws Exception {
            when(auditLogService.queryLogs(any())).thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .with(SecurityMockMvcRequestPostProcessors.user(adminPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(1));
        }

        @Test
        @DisplayName("HR_ADMIN xem logs → 200")
        void hrAdmin_canViewLogs_200() throws Exception {
            when(auditLogService.queryLogs(any())).thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrAdminPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Manager cố xem logs → 403 Forbidden")
        void manager_cannotViewLogs_403() throws Exception {
            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .with(SecurityMockMvcRequestPostProcessors.user(managerPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());

            verify(auditLogService, never()).queryLogs(any());
        }

        @Test
        @DisplayName("Employee cố xem logs → 403 Forbidden")
        void employee_cannotViewLogs_403() throws Exception {
            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .with(SecurityMockMvcRequestPostProcessors.user(employeePrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());

            verify(auditLogService, never()).queryLogs(any());
        }

        @Test
        @DisplayName("Không có token → 401 Unauthorized")
        void noToken_401() throws Exception {
            mockMvc.perform(get("/api/v1/admin/audit-logs"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Response không chứa password hay token field")
        void response_noSensitiveFields() throws Exception {
            when(auditLogService.queryLogs(any())).thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .with(SecurityMockMvcRequestPostProcessors.user(adminPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].password").doesNotExist())
                    .andExpect(jsonPath("$.data.content[0].accessToken").doesNotExist())
                    .andExpect(jsonPath("$.data.content[0].refreshToken").doesNotExist())
                    .andExpect(jsonPath("$.data.content[0].secret").doesNotExist());
        }

        @Test
        @DisplayName("Filter params truyền vào service đúng")
        void filterParams_passedCorrectly() throws Exception {
            when(auditLogService.queryLogs(any())).thenReturn(
                    PageResponse.<AuditLogSummaryResponse>builder()
                            .content(List.of()).page(0).size(10)
                            .totalElements(0L).totalPages(0).build());

            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .param("userId", "3")
                            .param("result", "FAILED")
                            .param("actionType", "LOGIN_FAILED")
                            .param("page", "0").param("size", "10")
                            .with(SecurityMockMvcRequestPostProcessors.user(adminPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
            verify(auditLogService).queryLogs(argThat(f ->
                    Objects.equals(f.getUserId(), 3L) &&
                            f.getResult() == AuditResult.FAILED &&
                            f.getActionType() == AuditActionType.LOGIN_FAILED
            ));
        }

        @Test
        @DisplayName("Kết quả rỗng → 200 empty page (không phải 404)")
        void emptyResult_200EmptyPage() throws Exception {
            when(auditLogService.queryLogs(any())).thenReturn(
                    PageResponse.<AuditLogSummaryResponse>builder()
                            .content(List.of()).page(0).size(20)
                            .totalElements(0L).totalPages(0).build());

            mockMvc.perform(get("/api/v1/admin/audit-logs")
                            .param("userId", "999")
                            .with(SecurityMockMvcRequestPostProcessors.user(adminPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }
    }

}