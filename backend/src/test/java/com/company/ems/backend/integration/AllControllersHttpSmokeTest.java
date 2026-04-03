package com.company.ems.backend.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

// ── Controllers ───────────────────────────────────────────────────────────────
import com.company.ems.backend.asset.controller.AssetController;
import com.company.ems.backend.asset.incident.controller.AdminIncidentController;
import com.company.ems.backend.asset.incident.controller.MyAssetController;
import com.company.ems.backend.asset.request.controller.AdminAssetRequestController;
import com.company.ems.backend.attendance.controller.AdminOfficeConfigController;
import com.company.ems.backend.attendance.controller.AdminOfficeLocationController;
import com.company.ems.backend.attendance.controller.AdminPositionLocationMappingController;
import com.company.ems.backend.attendance.controller.AttendanceAdjustmentController;
import com.company.ems.backend.attendance.controller.AttendanceController;
import com.company.ems.backend.auditlog.controller.AuditLogController;
import com.company.ems.backend.department.controller.DepartmentController;
import com.company.ems.backend.employee.controller.EmployeeController;
import com.company.ems.backend.leave.controller.LeaveBalanceController;
import com.company.ems.backend.leave.controller.LeaveController;
import com.company.ems.backend.payroll.controller.PayrollController;
import com.company.ems.backend.payroll.controller.SalaryComponentController;
import com.company.ems.backend.performance.kpi.controller.KpiObjectiveController;
import com.company.ems.backend.performance.review.controller.OneOnOneMeetingController;
import com.company.ems.backend.performance.review.controller.PerformanceReviewController;
import com.company.ems.backend.position.controller.PositionController;
import com.company.ems.backend.security.controller.PasswordController;
import com.company.ems.backend.security.controller.TwoFactorAuthController;
import com.company.ems.backend.user.controller.RoleController;
import com.company.ems.backend.workflow.controller.WorkflowTemplateController;
import com.company.ems.backend.announcement.controller.AnnouncementController;

// ── Services / Use-cases ──────────────────────────────────────────────────────
import com.company.ems.backend.asset.service.AssetService;
import com.company.ems.backend.asset.incident.service.IncidentService;
import com.company.ems.backend.asset.request.service.AssetRequestService;
import com.company.ems.backend.attendance.service.AttendanceAdjustmentService;
import com.company.ems.backend.attendance.service.AttendanceService;
import com.company.ems.backend.attendance.service.OfficeConfigService;
import com.company.ems.backend.attendance.service.OfficeLocationService;
import com.company.ems.backend.attendance.service.PositionLocationMappingService;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.employee.service.EmployeeService;
import com.company.ems.backend.leave.service.LeaveBalanceService;
import com.company.ems.backend.leave.service.LeaveService;
import com.company.ems.backend.payroll.application.usecase.RunPayrollUseCase;
import com.company.ems.backend.payroll.application.usecase.RecalculatePayrollUseCase;
import com.company.ems.backend.payroll.application.usecase.GetMyPayrollHistoryUseCase;
import com.company.ems.backend.payroll.application.usecase.GetPayrollByPeriodUseCase;
import com.company.ems.backend.payroll.application.usecase.ExportPayrollCsvUseCase;
import com.company.ems.backend.payroll.service.SalaryComponentService;
import com.company.ems.backend.performance.kpi.service.KpiObjectiveService;
import com.company.ems.backend.performance.review.service.PerformanceReviewService;
import com.company.ems.backend.security.service.PasswordService;
import com.company.ems.backend.security.service.TwoFactorAuthService;
import com.company.ems.backend.workflow.service.WorkflowAdminService;
import com.company.ems.backend.announcement.service.AnnouncementService;

// ── Repos injected directly by controllers ────────────────────────────────────
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.performance.review.repository.OneOnOneMeetingRepository;
import com.company.ems.backend.position.repository.PositionRepository;
import com.company.ems.backend.user.repository.RoleRepository;

// ── Shared infrastructure ─────────────────────────────────────────────────────
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.common.audit.SecurityAuditService;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.rbac.evaluator.CustomPermissionEvaluator;
import com.company.ems.backend.rbac.service.DataScopeService;

/**
 * HTTP Smoke Test — kiểm tra toàn bộ 27 controllers, mỗi endpoint phải trả về
 * status KHÁC 500 (Internal Server Error).
 *
 * Chiến lược:
 *  - @WebMvcTest với ALL controllers → Spring MVC layer được khởi tạo đầy đủ.
 *  - Tất cả services/repos được mock → không cần DB thật.
 *  - @AutoConfigureMockMvc(addFilters = false) → bỏ qua Security filter để
 *    test thuần controller logic.
 *  - Mọi mock trả về giá trị mặc định (empty/null) để đảm bảo controller
 *    không throw NullPointerException từ service layer.
 *
 * Kết quả mong đợi: 2xx hoặc 4xx — KHÔNG được 5xx.
 */
@WebMvcTest(controllers = {
        // Asset
        AssetController.class,
        AdminIncidentController.class,
        MyAssetController.class,
        AdminAssetRequestController.class,
        // Attendance
        AdminOfficeConfigController.class,
        AdminOfficeLocationController.class,
        AdminPositionLocationMappingController.class,
        AttendanceController.class,
        AttendanceAdjustmentController.class,
        // Audit
        AuditLogController.class,
        // Department / Position / Role
        DepartmentController.class,
        PositionController.class,
        RoleController.class,
        // Employee
        EmployeeController.class,
        // Leave
        LeaveController.class,
        LeaveBalanceController.class,
        // Payroll
        PayrollController.class,
        SalaryComponentController.class,
        // Performance
        PerformanceReviewController.class,
        KpiObjectiveController.class,
        OneOnOneMeetingController.class,
        // Security
        PasswordController.class,
        TwoFactorAuthController.class,
        // Workflow
        WorkflowTemplateController.class,
        // Announcement
        AnnouncementController.class,
})
@AutoConfigureMockMvc(addFilters = false)
@Import({StorageProperties.class})
@DisplayName("HTTP 500 Smoke Test — All Controllers")
class AllControllersHttpSmokeTest {

    @Autowired
    MockMvc mockMvc;

    // ── Services ──────────────────────────────────────────────────────────────
    @MockitoBean AssetService assetService;
    @MockitoBean IncidentService incidentService;
    @MockitoBean AssetRequestService assetRequestService;
    @MockitoBean AttendanceService attendanceService;
    @MockitoBean AttendanceAdjustmentService adjustmentService;
    @MockitoBean OfficeConfigService officeConfigService;
    @MockitoBean OfficeLocationService officeLocationService;
    @MockitoBean PositionLocationMappingService positionLocationMappingService;
    @MockitoBean AuditLogService auditLogService;
    @MockitoBean EmployeeService employeeService;
    @MockitoBean LeaveService leaveService;
    @MockitoBean LeaveBalanceService leaveBalanceService;
    @MockitoBean RunPayrollUseCase runPayrollUseCase;
    @MockitoBean RecalculatePayrollUseCase recalculatePayrollUseCase;
    @MockitoBean GetMyPayrollHistoryUseCase getMyPayrollHistoryUseCase;
    @MockitoBean GetPayrollByPeriodUseCase getPayrollByPeriodUseCase;
    @MockitoBean ExportPayrollCsvUseCase exportPayrollCsvUseCase;
    @MockitoBean SalaryComponentService salaryComponentService;
    @MockitoBean PerformanceReviewService performanceReviewService;
    @MockitoBean KpiObjectiveService kpiObjectiveService;
    @MockitoBean PasswordService passwordService;
    @MockitoBean TwoFactorAuthService twoFactorAuthService;
    @MockitoBean WorkflowAdminService workflowAdminService;
    @MockitoBean AnnouncementService announcementService;

    // ── Repos used directly by controllers ────────────────────────────────────
    @MockitoBean DepartmentRepository departmentRepository;
    @MockitoBean PositionRepository positionRepository;
    @MockitoBean RoleRepository roleRepository;
    @MockitoBean EmployeeRepository employeeRepository;
    @MockitoBean OneOnOneMeetingRepository oneOnOneMeetingRepository;

    // ── Infrastructure ─────────────────────────────────────────────────────────
    @MockitoBean MessageService messages;
    @MockitoBean DataScopeService dataScopeService;
    @MockitoBean JwtTokenUtil jwtTokenUtil;
    @MockitoBean CustomUserDetailsService customUserDetailsService;
    @MockitoBean SecurityAuditService securityAuditService;
    @MockitoBean CustomPermissionEvaluator customPermissionEvaluator;

    @BeforeEach
    void setupCommonMocks() {
        // Messages trả về chuỗi rỗng để tránh NPE trong ApiResponse
        Mockito.when(messages.get(Mockito.any(MessageCode.class))).thenReturn("OK");
        Mockito.when(messages.get(Mockito.any(MessageCode.class), Mockito.any())).thenReturn("OK");

        // Các repo trả về list rỗng để tránh NPE trong DepartmentController / PositionController / RoleController
        Mockito.when(departmentRepository.findAllByIsActiveTrue()).thenReturn(List.of());
        Mockito.when(positionRepository.findAllActiveWithDepartment()).thenReturn(List.of());
        Mockito.when(positionRepository.findAllActiveByDepartmentId(Mockito.anyLong())).thenReturn(List.of());
        Mockito.when(roleRepository.findAllByIsDeletedFalse()).thenReturn(List.of());

        // Asset
        Mockito.when(assetService.listAssets(
                Mockito.anyInt(), Mockito.anyInt(),
                Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "assets"));
        Mockito.when(assetService.previewNextCode())
                .thenReturn(null);

        // Incident
        Mockito.when(incidentService.getAllReports(
                Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(),
                Mockito.any(), Mockito.anyInt(), Mockito.anyInt()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "reports"));
        Mockito.when(incidentService.getMyAssets(Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "assets"));
        Mockito.when(incidentService.getMyReports(
                Mockito.anyInt(), Mockito.anyInt(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "reports"));

        // AssetRequest
        Mockito.when(assetRequestService.getAllRequests(
                Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(),
                Mockito.any(), Mockito.anyInt(), Mockito.anyInt()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "requests"));
        Mockito.when(assetRequestService.getMyRequests(
                Mockito.anyInt(), Mockito.anyInt(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "requests"));

        // Attendance — getAttendance(int page, int size, Long employeeId, LocalDate, LocalDate, String status, CustomUserPrincipal)
        Mockito.when(attendanceService.getAttendance(
                Mockito.anyInt(), Mockito.anyInt(),
                Mockito.any(), Mockito.any(), Mockito.any(),
                Mockito.any(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "attendances"));
        // AttendanceAdjustment — getMyRequests(int page, int size, CustomUserPrincipal)
        Mockito.when(adjustmentService.getMyRequests(
                Mockito.anyInt(), Mockito.anyInt(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "adjustments"));

        // OfficeConfig / OfficeLocation / PositionMapping
        Mockito.when(officeLocationService.getAllLocations()).thenReturn(List.of());
        Mockito.when(positionLocationMappingService.getAllMappings()).thenReturn(List.of());

        // AuditLog
        Mockito.when(auditLogService.getAuditLogs(Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "logs"));

        // Employee — getAllEmployees(int page, int size, String dept, String pos, String status, String search)
        Mockito.when(employeeService.getAllEmployees(
                Mockito.anyInt(), Mockito.anyInt(),
                Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "employees"));

        // Leave — getAllLeaves(int page, int size, Long empId, String status, String type, LocalDate, LocalDate)
        Mockito.when(leaveService.getAllLeaves(
                Mockito.anyInt(), Mockito.anyInt(),
                Mockito.any(), Mockito.any(), Mockito.any(),
                Mockito.any(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "leaves"));
        Mockito.when(leaveService.getMyLeaves(Mockito.anyInt(), Mockito.anyInt()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "leaves"));
        // LeaveBalance — getBalanceForEmployee(Long)
        Mockito.when(leaveBalanceService.getBalanceForEmployee(Mockito.anyLong())).thenReturn(List.of());

        // Payroll
        Mockito.when(getMyPayrollHistoryUseCase.execute()).thenReturn(List.of());

        // SalaryComponent
        Mockito.when(salaryComponentService.listComponents()).thenReturn(List.of());

        // Performance
        Mockito.when(performanceReviewService.listReviews(
                Mockito.any(), Mockito.any(), Mockito.anyInt(), Mockito.anyInt()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "reviews"));
        // KpiObjective — listObjectives(int page, int size, ScopeType, Long, KpiType, KpiStatus, String)
        Mockito.when(kpiObjectiveService.listObjectives(
                Mockito.anyInt(), Mockito.anyInt(),
                Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(PageResponse.of(List.of(), 0, 10, 0L, 0, "kpis"));

        // OneOnOne - repo
        Mockito.when(oneOnOneMeetingRepository.findByManagerIdAndEmployeeId(
                Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        Mockito.when(oneOnOneMeetingRepository.findByManagerId(
                Mockito.any(), Mockito.any()))
                .thenReturn(org.springframework.data.domain.Page.empty());
        // employeeRepository cho OneOnOneMeetingController.currentEmployee()
        Mockito.when(employeeRepository.findByUserUsername(Mockito.anyString()))
                .thenReturn(java.util.Optional.of(stubEmployee()));

        // Workflow
        Mockito.when(workflowAdminService.getAll()).thenReturn(List.of());

        // Announcement — getAnnouncementsForUser(Long userId) — chỉ 1 tham số
        Mockito.when(announcementService.getAnnouncementsForUser(Mockito.any()))
                .thenReturn(List.of());

        // DataScopeService — cho các controller gọi getCurrentPrincipal()
        CustomUserPrincipal principal = new CustomUserPrincipal(
                1L, "admin01", "pw", true, true, true, true,
                List.of(),
                java.util.Set.of(com.company.ems.backend.user.enums.DataScope.ALL));
        Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(principal);
    }

    private com.company.ems.backend.employee.entity.Employee stubEmployee() {
        return com.company.ems.backend.employee.entity.Employee.builder()
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. ASSET CONTROLLER  /api/v1/assets
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. AssetController")
    class AssetControllerTests {

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/assets/next-code → not 500")
        void previewNextCode() throws Exception {
            mockMvc.perform(get("/api/v1/assets/next-code"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/assets → not 500")
        void listAssets() throws Exception {
            mockMvc.perform(get("/api/v1/assets"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("POST /api/v1/assets → not 500 (validation error acceptable)")
        void createAsset() throws Exception {
            mockMvc.perform(post("/api/v1/assets")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/assets/{id} → not 500")
        void getAsset() throws Exception {
            Mockito.when(assetService.resolveAssetId("1")).thenReturn(1L);
            Mockito.when(assetService.getAssetById(1L)).thenReturn(null);
            mockMvc.perform(get("/api/v1/assets/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. ADMIN INCIDENT  /api/v1/admin/asset-reports
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. AdminIncidentController")
    class AdminIncidentTests {

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/admin/asset-reports → not 500")
        void getAllReports() throws Exception {
            mockMvc.perform(get("/api/v1/admin/asset-reports"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/admin/asset-reports/{id} → not 500")
        void getDetail() throws Exception {
            Mockito.when(incidentService.getReportDetail(1L)).thenReturn(null);
            mockMvc.perform(get("/api/v1/admin/asset-reports/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. MY ASSET CONTROLLER  /api/v1/my
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. MyAssetController")
    class MyAssetTests {

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/my/assets → not 500")
        void getMyAssets() throws Exception {
            mockMvc.perform(get("/api/v1/my/assets"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/my/reports → not 500")
        void getMyReports() throws Exception {
            mockMvc.perform(get("/api/v1/my/reports"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("POST /api/v1/my/asset-requests → not 500 (validation error acceptable)")
        void submitAssetRequest() throws Exception {
            mockMvc.perform(post("/api/v1/my/asset-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/my/asset-requests → not 500")
        void getMyAssetRequests() throws Exception {
            mockMvc.perform(get("/api/v1/my/asset-requests"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. ADMIN ASSET REQUEST  /api/v1/admin/asset-requests
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. AdminAssetRequestController")
    class AdminAssetRequestTests {

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/admin/asset-requests → not 500")
        void getAllRequests() throws Exception {
            mockMvc.perform(get("/api/v1/admin/asset-requests"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/admin/asset-requests/{id} → not 500")
        void getRequestDetail() throws Exception {
            Mockito.when(assetRequestService.getRequestDetail(1L)).thenReturn(null);
            mockMvc.perform(get("/api/v1/admin/asset-requests/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. ADMIN OFFICE CONFIG  /api/v1/admin/config/office-location
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. AdminOfficeConfigController")
    class AdminOfficeConfigTests {

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("GET /api/v1/admin/config/office-location → not 500")
        void getOfficeConfig() throws Exception {
            Mockito.when(officeConfigService.getOfficeConfig()).thenReturn(null);
            mockMvc.perform(get("/api/v1/admin/config/office-location"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("PUT /api/v1/admin/config/office-location → not 500 (validation error acceptable)")
        void updateManual() throws Exception {
            mockMvc.perform(put("/api/v1/admin/config/office-location")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("POST /api/v1/admin/config/office-location/auto → not 500")
        void updateAuto() throws Exception {
            mockMvc.perform(post("/api/v1/admin/config/office-location/auto")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. ADMIN OFFICE LOCATION  /api/v1/admin/office-locations
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. AdminOfficeLocationController")
    class AdminOfficeLocationTests {

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("GET /api/v1/admin/office-locations → not 500")
        void getAllLocations() throws Exception {
            mockMvc.perform(get("/api/v1/admin/office-locations"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("POST /api/v1/admin/office-locations → not 500 (validation error acceptable)")
        void createLocation() throws Exception {
            mockMvc.perform(post("/api/v1/admin/office-locations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("DELETE /api/v1/admin/office-locations/1 → not 500")
        void deleteLocation() throws Exception {
            mockMvc.perform(delete("/api/v1/admin/office-locations/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. ADMIN POSITION LOCATION MAPPING
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. AdminPositionLocationMappingController")
    class PositionMappingTests {

        @Test
        @WithMockUser(authorities = {"PERM_SYSTEM_CONFIG_MANAGE"})
        @DisplayName("GET /api/v1/admin/office-locations/position-mappings → not 500")
        void getAllMappings() throws Exception {
            mockMvc.perform(get("/api/v1/admin/office-locations/position-mappings"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. ATTENDANCE CONTROLLER  /api/v1/attendance
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("8. AttendanceController")
    class AttendanceTests {

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/attendance → not 500")
        void listAttendances() throws Exception {
            mockMvc.perform(get("/api/v1/attendance"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. ATTENDANCE ADJUSTMENT  /api/v1/adjustment-requests
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("9. AttendanceAdjustmentController")
    class AdjustmentTests {

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/adjustment-requests/my → not 500")
        void getMyRequests() throws Exception {
            mockMvc.perform(get("/api/v1/adjustment-requests/my"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 10. AUDIT LOG  /api/v1/audit-logs
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("10. AuditLogController")
    class AuditLogTests {

        @Test
        @WithMockUser(authorities = {"PERM_AUDIT_LOG_VIEW"})
        @DisplayName("GET /api/v1/audit-logs → not 500")
        void listAuditLogs() throws Exception {
            mockMvc.perform(get("/api/v1/audit-logs"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_AUDIT_LOG_VIEW"})
        @DisplayName("GET /api/v1/audit-logs/{id} → not 500")
        void getById() throws Exception {
            Mockito.when(auditLogService.getById(1L)).thenReturn(null);
            mockMvc.perform(get("/api/v1/audit-logs/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 11. DEPARTMENT  /api/v1/departments
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("11. DepartmentController")
    class DepartmentTests {

        @Test
        @WithMockUser
        @DisplayName("GET /api/v1/departments → not 500")
        void getAllDepartments() throws Exception {
            mockMvc.perform(get("/api/v1/departments"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 12. POSITION  /api/v1/positions
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("12. PositionController")
    class PositionTests {

        @Test
        @WithMockUser
        @DisplayName("GET /api/v1/positions → not 500")
        void getAllPositions() throws Exception {
            mockMvc.perform(get("/api/v1/positions"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser
        @DisplayName("GET /api/v1/positions?departmentId=1 → not 500")
        void getAllPositionsByDept() throws Exception {
            mockMvc.perform(get("/api/v1/positions").param("departmentId", "1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 13. ROLE  /api/v1/roles
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("13. RoleController")
    class RoleTests {

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/roles → not 500")
        void getAllRoles() throws Exception {
            mockMvc.perform(get("/api/v1/roles"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 14. EMPLOYEE  /api/v1/employees
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("14. EmployeeController")
    class EmployeeTests {

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/employees → not 500")
        void listEmployees() throws Exception {
            mockMvc.perform(get("/api/v1/employees"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("POST /api/v1/employees → not 500 (validation error acceptable)")
        void createEmployee() throws Exception {
            mockMvc.perform(post("/api/v1/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 15. LEAVE  /api/v1/leave-requests
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("15. LeaveController")
    class LeaveTests {

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/leave-requests → not 500")
        void listLeaves() throws Exception {
            mockMvc.perform(get("/api/v1/leave-requests"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("POST /api/v1/leave-requests → not 500 (validation error acceptable)")
        void createLeave() throws Exception {
            mockMvc.perform(post("/api/v1/leave-requests")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 16. LEAVE BALANCE  /api/v1/leave-balances
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("16. LeaveBalanceController")
    class LeaveBalanceTests {

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/leave-balances/my → not 500")
        void getMyBalances() throws Exception {
            mockMvc.perform(get("/api/v1/leave-balances/my"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 17. PAYROLL  /api/v1/payroll
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("17. PayrollController")
    class PayrollTests {

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/payroll/my-history → not 500")
        void getMyHistory() throws Exception {
            mockMvc.perform(get("/api/v1/payroll/my-history"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/payroll/period/2026-03 → not 500")
        void getByPeriod() throws Exception {
            Mockito.when(getPayrollByPeriodUseCase.execute("2026-03")).thenReturn(null);
            mockMvc.perform(get("/api/v1/payroll/period/2026-03"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("POST /api/v1/payroll/run → not 500")
        void runPayroll() throws Exception {
            Mockito.when(runPayrollUseCase.execute(Mockito.any())).thenReturn(null);
            mockMvc.perform(post("/api/v1/payroll/run")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"period\":\"2026-03\"}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("POST /api/v1/payroll/recalculate/2026-03 → not 500")
        void recalculatePayroll() throws Exception {
            Mockito.when(recalculatePayrollUseCase.execute(Mockito.any())).thenReturn(null);
            mockMvc.perform(post("/api/v1/payroll/recalculate/2026-03"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 18. SALARY COMPONENT  /api/v1/payroll/components
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("18. SalaryComponentController")
    class SalaryComponentTests {

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("GET /api/v1/payroll/components → not 500")
        void listComponents() throws Exception {
            mockMvc.perform(get("/api/v1/payroll/components"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("POST /api/v1/payroll/components → not 500 (validation error acceptable)")
        void createComponent() throws Exception {
            mockMvc.perform(post("/api/v1/payroll/components")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_ADMIN"})
        @DisplayName("PUT /api/v1/payroll/components/1 → not 500 (validation error acceptable)")
        void updateComponent() throws Exception {
            mockMvc.perform(put("/api/v1/payroll/components/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 19. PERFORMANCE REVIEW  /api/v1/performance/reviews
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("19. PerformanceReviewController")
    class PerformanceReviewTests {

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/performance/reviews → not 500")
        void listReviews() throws Exception {
            mockMvc.perform(get("/api/v1/performance/reviews"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/performance/reviews → not 500 (validation error acceptable)")
        void saveReview() throws Exception {
            mockMvc.perform(post("/api/v1/performance/reviews")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 20. KPI OBJECTIVE  /api/v1/kpi-objectives
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("20. KpiObjectiveController")
    class KpiTests {

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/kpi-objectives → not 500")
        void listObjectives() throws Exception {
            mockMvc.perform(get("/api/v1/kpi-objectives"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/kpi-objectives → not 500 (validation error acceptable)")
        void createObjective() throws Exception {
            mockMvc.perform(post("/api/v1/kpi-objectives")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 21. ONE-ON-ONE MEETING  /api/v1/performance/one-on-one
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("21. OneOnOneMeetingController")
    class OneOnOneTests {

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("GET /api/v1/performance/one-on-one/my → not 500")
        void listMine() throws Exception {
            mockMvc.perform(get("/api/v1/performance/one-on-one/my"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("GET /api/v1/performance/one-on-one/employee/10 → not 500")
        void listByEmployee() throws Exception {
            mockMvc.perform(get("/api/v1/performance/one-on-one/employee/10"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/performance/one-on-one → not 500 (validation error acceptable)")
        void create() throws Exception {
            mockMvc.perform(post("/api/v1/performance/one-on-one")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("DELETE /api/v1/performance/one-on-one/1 → not 500")
        void deleteRecord() throws Exception {
            com.company.ems.backend.performance.review.entity.OneOnOneMeeting meeting =
                    com.company.ems.backend.performance.review.entity.OneOnOneMeeting.builder()
                            .managerId(1L)
                            .employeeId(10L)
                            .meetingDate(java.time.LocalDate.now())
                            .build();
            Mockito.when(oneOnOneMeetingRepository.findById(1L))
                    .thenReturn(java.util.Optional.of(meeting));
            mockMvc.perform(delete("/api/v1/performance/one-on-one/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 22. PASSWORD  /api/v1/password
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("22. PasswordController")
    class PasswordTests {

        @Test
        @WithMockUser(username = "user01")
        @DisplayName("POST /api/v1/password/change → not 500 (validation error acceptable)")
        void changePassword() throws Exception {
            mockMvc.perform(post("/api/v1/password/change")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 23. TWO-FACTOR AUTH  /api/v1/2fa
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("23. TwoFactorAuthController")
    class TwoFactorTests {

        @Test
        @WithMockUser(username = "user01")
        @DisplayName("POST /api/v1/2fa/setup → not 500")
        void setup2FA() throws Exception {
            Mockito.when(twoFactorAuthService.setup2FA("user01")).thenReturn(null);
            mockMvc.perform(post("/api/v1/2fa/setup"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "user01")
        @DisplayName("GET /api/v1/2fa/status → not 500")
        void get2FAStatus() throws Exception {
            Mockito.when(twoFactorAuthService.is2FAEnabled("user01")).thenReturn(false);
            mockMvc.perform(get("/api/v1/2fa/status"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "user01")
        @DisplayName("POST /api/v1/2fa/verify → not 500 (validation error acceptable)")
        void verify2FA() throws Exception {
            mockMvc.perform(post("/api/v1/2fa/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(username = "user01")
        @DisplayName("POST /api/v1/2fa/disable → not 500 (validation error acceptable)")
        void disable2FA() throws Exception {
            mockMvc.perform(post("/api/v1/2fa/disable")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 24. WORKFLOW TEMPLATE  /api/v1/admin/workflow-templates
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("24. WorkflowTemplateController")
    class WorkflowTemplateTests {

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("GET /api/v1/admin/workflow-templates → not 500")
        void getAll() throws Exception {
            mockMvc.perform(get("/api/v1/admin/workflow-templates"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("GET /api/v1/admin/workflow-templates/{id} → not 500")
        void getById() throws Exception {
            Mockito.when(workflowAdminService.getById(1L)).thenReturn(null);
            mockMvc.perform(get("/api/v1/admin/workflow-templates/1"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("POST /api/v1/admin/workflow-templates → not 500 (validation error acceptable)")
        void create() throws Exception {
            mockMvc.perform(post("/api/v1/admin/workflow-templates")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("DELETE /api/v1/admin/workflow-templates/1 → not 500")
        void deleteTemplate() throws Exception {
            mockMvc.perform(delete("/api/v1/admin/workflow-templates/1"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("POST /api/v1/admin/workflow-templates/1/levels → not 500 (validation error acceptable)")
        void addLevel() throws Exception {
            mockMvc.perform(post("/api/v1/admin/workflow-templates/1/levels")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"PERM_ATTENDANCE_ADJUSTMENT_ADMIN"})
        @DisplayName("DELETE /api/v1/admin/workflow-templates/1/levels/1 → not 500")
        void deleteLevel() throws Exception {
            mockMvc.perform(delete("/api/v1/admin/workflow-templates/1/levels/1"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 25. ANNOUNCEMENT  /api/v1/announcements
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("25. AnnouncementController")
    class AnnouncementTests {

        @Test
        @WithMockUser(authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/announcements → not 500")
        void listAnnouncements() throws Exception {
            mockMvc.perform(get("/api/v1/announcements"))
                    .andExpect(status().is(not500()));
        }

        @Test
        @WithMockUser(authorities = {"ROLE_HR"})
        @DisplayName("POST /api/v1/announcements → not 500 (validation error acceptable)")
        void createAnnouncement() throws Exception {
            mockMvc.perform(post("/api/v1/announcements")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().is(not500()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Utility: custom matcher — chấp nhận 2xx và 4xx, reject 5xx
    // ═══════════════════════════════════════════════════════════════════════════
    private static org.hamcrest.Matcher<Integer> not500() {
        return org.hamcrest.Matchers.not(
                org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.greaterThanOrEqualTo(500),
                        org.hamcrest.Matchers.lessThan(600)));
    }
}
