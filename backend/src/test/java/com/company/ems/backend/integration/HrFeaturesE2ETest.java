package com.company.ems.backend.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

import com.company.ems.backend.announcement.controller.AnnouncementController;
import com.company.ems.backend.announcement.dto.AnnouncementResponse;
import com.company.ems.backend.announcement.dto.CreateAnnouncementResponse;
import com.company.ems.backend.announcement.service.AnnouncementService;
import com.company.ems.backend.attendance.controller.AttendanceAdjustmentController;
import com.company.ems.backend.attendance.controller.AttendanceController;
import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.AttendanceSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.service.AttendanceAdjustmentService;
import com.company.ems.backend.attendance.service.AttendanceService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.common.audit.SecurityAuditService;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.employee.controller.EmployeeController;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.employee.service.EmployeeService;
import com.company.ems.backend.leave.controller.LeaveBalanceController;
import com.company.ems.backend.leave.controller.LeaveController;
import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.service.LeaveBalanceService;
import com.company.ems.backend.leave.service.LeaveService;
import com.company.ems.backend.performance.kpi.controller.KpiObjectiveController;
import com.company.ems.backend.performance.kpi.dto.KpiObjectiveDto;
import com.company.ems.backend.performance.kpi.service.KpiObjectiveService;
import com.company.ems.backend.performance.review.controller.PerformanceReviewController;
import com.company.ems.backend.performance.review.dto.PerformanceReviewDto;
import com.company.ems.backend.performance.review.service.PerformanceReviewService;
import com.company.ems.backend.rbac.evaluator.CustomPermissionEvaluator;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * E2E Tests for all HR Features.
 *
 * Phạm vi kiểm tra:
 * 1. Employee Management (CRUD, soft-delete, team, managers)
 * 2. Leave Management (tạo, duyệt, hủy, xem balance)
 * 3. Attendance (check-in/out, summary, adjustment workflow)
 * 4. Performance Review (tạo, xem, latest)
 * 5. KPI Objectives (CRUD, list, summary)
 * 6. Announcements (tạo, xem, đánh dấu đã đọc)
 */
@WebMvcTest(controllers = {
        EmployeeController.class,
        LeaveController.class,
        LeaveBalanceController.class,
        AttendanceController.class,
        AttendanceAdjustmentController.class,
        PerformanceReviewController.class,
        KpiObjectiveController.class,
        AnnouncementController.class
})
@AutoConfigureMockMvc(addFilters = false)
@Import({StorageProperties.class})
@DisplayName("HR Features E2E Test Suite")
class HrFeaturesE2ETest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    // ── Services ──────────────────────────────────────────────────────────────
    @MockitoBean EmployeeService employeeService;
    @MockitoBean LeaveService leaveService;
    @MockitoBean LeaveBalanceService leaveBalanceService;
    @MockitoBean AttendanceService attendanceService;
    @MockitoBean AttendanceAdjustmentService adjustmentService;
    @MockitoBean PerformanceReviewService reviewService;
    @MockitoBean KpiObjectiveService kpiService;
    @MockitoBean AnnouncementService announcementService;

    // ── Infrastructure ────────────────────────────────────────────────────────
    @MockitoBean EmployeeRepository employeeRepository;
    @MockitoBean DataScopeService dataScopeService;
    @MockitoBean JwtTokenUtil jwtTokenUtil;
    @MockitoBean CustomUserDetailsService customUserDetailsService;
    @MockitoBean MessageService messages;
    @MockitoBean SecurityAuditService securityAuditService;
    @MockitoBean CustomPermissionEvaluator customPermissionEvaluator;

    // ── Shared fixtures ───────────────────────────────────────────────────────
    private CustomUserPrincipal hrPrincipal;
    private CustomUserPrincipal empPrincipal;
    private Employee stubEmployee;

    @BeforeEach
    void globalSetup() {
        Mockito.when(messages.get(any(MessageCode.class))).thenReturn("Success");
        Mockito.when(messages.get(any(MessageCode.class), any())).thenReturn("Success");

        hrPrincipal = new CustomUserPrincipal(1L, "hr01", "pw", true, true, true, true,
                List.of(), java.util.Set.of(com.company.ems.backend.user.enums.DataScope.ALL));
        empPrincipal = new CustomUserPrincipal(2L, "emp01", "pw", true, true, true, true,
                List.of(), java.util.Set.of(com.company.ems.backend.user.enums.DataScope.SELF));

        stubEmployee = new Employee();
        stubEmployee.setId(10L);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. EMPLOYEE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. Employee Management")
    class EmployeeManagementTests {

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/employees → 200 danh sách nhân viên")
        void listEmployees_returns200() throws Exception {
            EmployeeResponse emp = EmployeeResponse.builder()
                    .id(10L).firstName("Nguyen").lastName("Van A").employeeCode("EMP-001").build();
            PageResponse<EmployeeResponse> page = PageResponse.of(List.of(emp), 0, 10, 1L, 1, "employees");
            Mockito.when(employeeService.getAllEmployees(0, 10, null, null, null, null)).thenReturn(page);

            mockMvc.perform(get("/api/v1/employees").param("page", "0").param("size", "10"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].id").value(10))
                    .andExpect(jsonPath("$.data.content[0].firstName").value("Nguyen"));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/employees/{id} → 200 chi tiết nhân viên")
        void getEmployeeById_returns200() throws Exception {
            EmployeeResponse emp = EmployeeResponse.builder().id(10L).firstName("Nguyen").lastName("Van A").build();
            Mockito.when(employeeService.getEmployeeById(10L)).thenReturn(emp);

            mockMvc.perform(get("/api/v1/employees/10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(10));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("POST /api/v1/employees → 201 tạo nhân viên mới")
        void createEmployee_returns201() throws Exception {
            EmployeeResponse emp = EmployeeResponse.builder().id(11L).firstName("Tran").lastName("Thi B").build();
            Mockito.when(employeeService.createEmployee(any())).thenReturn(emp);

            String body = """
                    {"firstName":"Tran","lastName":"Thi B","email":"b@test.com",
                     "dateOfBirth":"1995-05-10","hireDate":"2024-01-01","salary":10000000.0,
                     "phone":"0900000001","departmentId":1,"positionId":1,
                     "contractType":"FULL_TIME","nationalId":"123456789012",
                     "address":"123 Test St"}
                    """;

            mockMvc.perform(post("/api/v1/employees").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").value(11));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("PUT /api/v1/employees/{id} → 200 cập nhật nhân viên")
        void updateEmployee_returns200() throws Exception {
            EmployeeResponse emp = EmployeeResponse.builder().id(10L).firstName("Nguyen").lastName("Van A Updated").build();
            Mockito.when(employeeService.updateEmployee(anyLong(), any())).thenReturn(emp);

            String body = """
                    {"firstName":"Nguyen","lastName":"Van A Updated","email":"a@test.com",
                     "dateOfBirth":"1990-01-01","hireDate":"2023-01-01","salary":15000000.0,
                     "phone":"0900000000","departmentId":1,"positionId":1,
                     "contractType":"FULL_TIME","nationalId":"123456789000",
                     "address":"456 Test Ave"}
                    """;

            mockMvc.perform(put("/api/v1/employees/10").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.firstName").value("Nguyen"));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("DELETE /api/v1/employees/{id} → 200 soft-delete nhân viên")
        void deleteEmployee_returns200() throws Exception {
            Mockito.doNothing().when(employeeService).deleteEmployee(10L);

            mockMvc.perform(delete("/api/v1/employees/10").with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/employees/me → 200 profile cá nhân")
        void getMyProfile_returns200() throws Exception {
            com.company.ems.backend.employee.dto.PublicEmployeeResponse profile =
                    com.company.ems.backend.employee.dto.PublicEmployeeResponse.builder()
                            .id(10L).firstName("Nguyen").lastName("Van A").build();
            Mockito.when(employeeService.getMyProfile()).thenReturn(profile);

            mockMvc.perform(get("/api/v1/employees/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.firstName").value("Nguyen"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("GET /api/v1/employees/team → 200 danh sách team")
        void getTeamMembers_returns200() throws Exception {
            MemberResponse member = MemberResponse.builder().id(20L).fullName("Team Member").build();
            PageResponse<MemberResponse> page = PageResponse.of(List.of(member), 0, 10, 1L, 1, "members");
            Mockito.when(employeeService.getTeamMembers(0, 10, null)).thenReturn(page);

            mockMvc.perform(get("/api/v1/employees/team").param("page", "0").param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].fullName").value("Team Member"));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/employees/managers → 200 danh sách managers")
        void getManagers_returns200() throws Exception {
            Mockito.when(employeeService.getManagers()).thenReturn(List.of(
                    java.util.Map.of("id", 5L, "fullName", "Manager A")));

            mockMvc.perform(get("/api/v1/employees/managers"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].fullName").value("Manager A"));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. LEAVE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. Leave Management")
    class LeaveManagementTests {

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("POST /api/v1/leaves → 201 tạo đơn xin nghỉ")
        void createLeave_returns201() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).status("PENDING").build();
            Mockito.when(leaveService.createLeaveRequest(any())).thenReturn(resp);

            String body = """
                    {"employeeId":10,"leaveType":"ANNUAL",
                     "startDate":"2026-04-01","endDate":"2026-04-03","reason":"Du lịch"}
                    """;

            mockMvc.perform(post("/api/v1/leaves").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/leaves/me → 200 đơn nghỉ của tôi")
        void getMyLeaves_returns200() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).status("PENDING").build();
            PageResponse<LeaveResponse> page = PageResponse.of(List.of(resp), 0, 10, 1L, 1, "leaves");
            Mockito.when(leaveService.getMyLeaves(0, 10)).thenReturn(page);

            mockMvc.perform(get("/api/v1/leaves/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/leaves → 200 danh sách tất cả đơn nghỉ")
        void getAllLeaves_returns200() throws Exception {
            PageResponse<LeaveResponse> page = PageResponse.of(List.of(), 0, 10, 0L, 0, "leaves");
            Mockito.when(leaveService.getAllLeaves(anyInt(), anyInt(), isNull(), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/v1/leaves"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/leaves/{id} → 200 chi tiết đơn nghỉ")
        void getLeaveById_returns200() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).leaveType("ANNUAL").build();
            Mockito.when(leaveService.getLeaveById(1L)).thenReturn(resp);

            mockMvc.perform(get("/api/v1/leaves/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.leaveType").value("ANNUAL"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("PUT /api/v1/leaves/{id}/approve → 200 duyệt đơn")
        void approveLeave_returns200() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).status("APPROVED").build();
            Mockito.when(leaveService.approveLeave(anyLong(), any())).thenReturn(resp);

            String body = """
                    {"status":"APPROVED","notes":"Đồng ý"}
                    """;

            mockMvc.perform(put("/api/v1/leaves/1/approve").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("PUT /api/v1/leaves/{id}/action → 200 xử lý action (REJECT)")
        void actionLeave_reject_returns200() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).status("REJECTED").build();
            Mockito.when(leaveService.approveLeave(anyLong(), any())).thenReturn(resp);

            String body = """
                    {"action":"REJECT","comments":"Không hợp lệ"}
                    """;

            mockMvc.perform(put("/api/v1/leaves/1/action").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("REJECTED"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("PUT /api/v1/leaves/{id}/action SEND_BACK → 200 trả lại đơn")
        void actionLeave_sendBack_returns200() throws Exception {
            LeaveResponse resp = LeaveResponse.builder().id(1L).status("RETURNED_TO_EMPLOYEE").build();
            Mockito.when(leaveService.approveLeave(anyLong(), any())).thenReturn(resp);

            String body = """
                    {"action":"SEND_BACK","comments":"Cần bổ sung thông tin"}
                    """;

            mockMvc.perform(put("/api/v1/leaves/1/action").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("DELETE /api/v1/leaves/{id} → 200 hủy đơn nghỉ")
        void cancelLeave_returns200() throws Exception {
            Mockito.doNothing().when(leaveService).cancelLeave(1L);

            mockMvc.perform(delete("/api/v1/leaves/1").with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("PUT /api/v1/leaves/{id}/action action không hợp lệ → 4xx")
        void actionLeave_invalid_throwsException() throws Exception {
            String body = """
                    {"action":"INVALID_ACTION","comments":"test"}
                    """;

            mockMvc.perform(put("/api/v1/leaves/1/action").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. LEAVE BALANCE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. Leave Balance")
    class LeaveBalanceTests {

        @BeforeEach
        void setup() {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(hrPrincipal);
            Mockito.when(employeeRepository.findByUserId(1L)).thenReturn(Optional.of(stubEmployee));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/leave-balances → 200 balance của tôi")
        void getMyBalances_returns200() throws Exception {
            LeaveBalanceResponse balance = LeaveBalanceResponse.builder()
                    .leaveType("ANNUAL").totalDays(12).usedDays(2).remainingDays(10).build();
            Mockito.when(leaveBalanceService.getBalanceForEmployee(10L)).thenReturn(List.of(balance));

            mockMvc.perform(get("/api/v1/leave-balances"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].leaveType").value("ANNUAL"))
                    .andExpect(jsonPath("$.data[0].remainingDays").value(10));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/leave-balances/{employeeId} → 200 balance của nhân viên bất kỳ (HR)")
        void getEmployeeBalances_asHr_returns200() throws Exception {
            Employee target = new Employee();
            target.setId(20L);
            Mockito.when(employeeRepository.findById(20L)).thenReturn(Optional.of(target));
            Mockito.when(leaveBalanceService.getBalanceForEmployee(20L)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/leave-balances/20"))
                    .andExpect(status().isOk());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. ATTENDANCE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. Attendance")
    class AttendanceTests {

        @BeforeEach
        void setup() {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(empPrincipal);
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/attendance → 200 danh sách chấm công")
        void listAttendance_returns200() throws Exception {
            PageResponse<AttendanceResponse> page = PageResponse.of(List.of(), 0, 20, 0L, 0, "attendance");
            Mockito.when(attendanceService.getAttendance(anyInt(), anyInt(), isNull(), isNull(), isNull(), isNull(), any()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/v1/attendance"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/attendance/summary → 200 tóm tắt chấm công")
        void getAttendanceSummary_returns200() throws Exception {
            AttendanceSummaryResponse summary = AttendanceSummaryResponse.builder()
                    .totalDays(20).presentDays(18).lateDays(2).absentDays(0).build();
            Mockito.when(attendanceService.getSummary(isNull(), isNull(), isNull(), any())).thenReturn(summary);

            mockMvc.perform(get("/api/v1/attendance/summary"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalDays").value(20))
                    .andExpect(jsonPath("$.data.presentDays").value(18));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/attendance/calendar → 200 lịch chấm công")
        void getAttendanceCalendar_returns200() throws Exception {
            com.company.ems.backend.attendance.dto.AttendanceCalendarResponse calendar =
                    new com.company.ems.backend.attendance.dto.AttendanceCalendarResponse();
            Mockito.when(attendanceService.getMonthlyCalendar(isNull(), isNull(), any())).thenReturn(calendar);

            mockMvc.perform(get("/api/v1/attendance/calendar"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. ATTENDANCE ADJUSTMENT
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. Attendance Adjustment Workflow")
    class AttendanceAdjustmentTests {

        @BeforeEach
        void setup() {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(empPrincipal);
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("POST /api/v1/attendance/adjustments → 201 gửi yêu cầu giải trình")
        void submitAdjustment_returns201() throws Exception {
            AdjustmentRequestResponse resp = AdjustmentRequestResponse.builder()
                    .id(1L).status("PENDING_APPROVAL").build();
            Mockito.when(adjustmentService.submitRequest(any(), any())).thenReturn(resp);

            String body = """
                    {"requestDate":"2026-03-20","reasonType":"FORGOT_CHECKIN",
                     "reasonText":"Quên check-in hôm nay do vội đi họp sáng sớm",
                     "proposedCheckInTime":"2026-03-20T08:00:00",
                     "proposedCheckOutTime":"2026-03-20T17:00:00"}
                    """;

            mockMvc.perform(post("/api/v1/attendance/adjustments").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.status").value("PENDING_APPROVAL"));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/attendance/adjustments/my → 200 danh sách yêu cầu của tôi")
        void getMyAdjustments_returns200() throws Exception {
            PageResponse<AdjustmentRequestSummaryResponse> page =
                    PageResponse.of(List.of(), 0, 20, 0L, 0, "adjustments");
            Mockito.when(adjustmentService.getMyRequests(anyInt(), anyInt(), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/attendance/adjustments/my"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("GET /api/v1/attendance/adjustments/pending → 200 danh sách chờ duyệt")
        void getPendingAdjustments_returns200() throws Exception {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(hrPrincipal);
            PageResponse<AdjustmentRequestSummaryResponse> page =
                    PageResponse.of(List.of(), 0, 20, 0L, 0, "adjustments");
            Mockito.when(adjustmentService.getPendingForApprover(anyInt(), anyInt(), any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/attendance/adjustments/pending"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/attendance/adjustments/{id}/approve → 200 phê duyệt")
        void approveAdjustment_returns200() throws Exception {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(hrPrincipal);
            AdjustmentRequestResponse resp = AdjustmentRequestResponse.builder()
                    .id(1L).status("APPROVED").build();
            Mockito.when(adjustmentService.approve(anyLong(), any(), any())).thenReturn(resp);

            mockMvc.perform(post("/api/v1/attendance/adjustments/1/approve").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/attendance/adjustments/{id}/reject → 200 từ chối")
        void rejectAdjustment_returns200() throws Exception {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(hrPrincipal);
            AdjustmentRequestResponse resp = AdjustmentRequestResponse.builder()
                    .id(1L).status("REJECTED").build();
            Mockito.when(adjustmentService.reject(anyLong(), any(), any())).thenReturn(resp);

            String body = """
                    {"reason":"Thông tin không khớp"}
                    """;

            mockMvc.perform(post("/api/v1/attendance/adjustments/1/reject").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("REJECTED"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/attendance/adjustments/{id}/return → 200 trả lại nhân viên")
        void returnAdjustment_returns200() throws Exception {
            Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(hrPrincipal);
            AdjustmentRequestResponse resp = AdjustmentRequestResponse.builder()
                    .id(1L).status("RETURNED_TO_EMPLOYEE").build();
            Mockito.when(adjustmentService.returnToEmployee(anyLong(), any(), any())).thenReturn(resp);

            String body = """
                    {"reason":"Thiếu bằng chứng"}
                    """;

            mockMvc.perform(post("/api/v1/attendance/adjustments/1/return").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("PUT /api/v1/attendance/adjustments/{id}/resubmit → 200 gửi lại yêu cầu")
        void resubmitAdjustment_returns200() throws Exception {
            AdjustmentRequestResponse resp = AdjustmentRequestResponse.builder()
                    .id(1L).status("PENDING_APPROVAL").build();
            Mockito.when(adjustmentService.resubmit(anyLong(), any(), any())).thenReturn(resp);

            String body = """
                    {"requestDate":"2026-03-20","reasonType":"FORGOT_CHECKIN",
                     "reasonText":"Bổ sung bằng chứng: camera hỏng tại khu vực làm việc",
                     "proposedCheckInTime":"2026-03-20T08:00:00"}
                    """;

            mockMvc.perform(put("/api/v1/attendance/adjustments/1/resubmit").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 6. PERFORMANCE REVIEW
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. Performance Review")
    class PerformanceReviewTests {

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/performance/reviews → 201 tạo đánh giá")
        void saveReview_returns201() throws Exception {
            PerformanceReviewDto.Response resp = PerformanceReviewDto.Response.builder()
                    .revieweeId(10L).totalScore(85).rank("B").build();
            Mockito.when(reviewService.saveReview(any())).thenReturn(resp);

            String body = """
                    {"revieweeId":10,"reviewType":"MANAGER","reviewPeriod":"2026-Q1",
                     "comment":"Good","scores":{"expertise":85,"communication":90}}
                    """;

            mockMvc.perform(post("/api/v1/performance/reviews").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.totalScore").value(85))
                    .andExpect(jsonPath("$.data.rank").value("B"));
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/performance/reviews → 200 danh sách đánh giá")
        void listReviews_returns200() throws Exception {
            PageResponse<PerformanceReviewDto.Response> page =
                    PageResponse.of(List.of(), 0, 10, 0L, 0, "reviews");
            Mockito.when(reviewService.listReviews(isNull(), isNull(), anyInt(), anyInt())).thenReturn(page);

            mockMvc.perform(get("/api/v1/performance/reviews"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "hr01", authorities = {"ROLE_HR"})
        @DisplayName("GET /api/v1/performance/reviews/{id} → 200 chi tiết đánh giá")
        void getReviewById_returns200() throws Exception {
            PerformanceReviewDto.Response resp = PerformanceReviewDto.Response.builder()
                    .revieweeId(10L).totalScore(90).rank("A").build();
            Mockito.when(reviewService.getReview(1L)).thenReturn(resp);

            mockMvc.perform(get("/api/v1/performance/reviews/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.rank").value("A"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("GET /api/v1/performance/reviews/latest/{employeeId} → 200 đánh giá mới nhất")
        void getLatestReview_returns200() throws Exception {
            PerformanceReviewDto.Response resp = PerformanceReviewDto.Response.builder()
                    .revieweeId(10L).totalScore(80).rank("B+").build();
            Mockito.when(reviewService.getLatestForEmployee(10L)).thenReturn(resp);

            mockMvc.perform(get("/api/v1/performance/reviews/latest/10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.revieweeId").value(10));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 7. KPI OBJECTIVES
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. KPI Objectives")
    class KpiObjectiveTests {

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("POST /api/v1/kpi-objectives → 201 tạo KPI")
        void createKpi_returns201() throws Exception {
            KpiObjectiveDto.Response resp = KpiObjectiveDto.Response.builder()
                    .id(1L).name("Tăng doanh số 20%").build();
            Mockito.when(kpiService.createObjective(any())).thenReturn(resp);

            String body = """
                    {"name":"Tăng doanh số 20%","scopeType":"DEPARTMENT","scopeId":1,
                     "type":"KPI","metricType":"PERCENT","targetValue":20,"weight":100,
                     "periodStart":"2026-01-01","periodEnd":"2026-03-31"}
                    """;

            mockMvc.perform(post("/api/v1/kpi-objectives").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.name").value("Tăng doanh số 20%"));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/kpi-objectives → 200 danh sách KPI")
        void listKpis_returns200() throws Exception {
            PageResponse<KpiObjectiveDto.Summary> page =
                    PageResponse.of(List.of(), 0, 10, 0L, 0, "kpis");
            Mockito.when(kpiService.listObjectives(anyInt(), anyInt(), isNull(), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(page);

            mockMvc.perform(get("/api/v1/kpi-objectives"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/kpi-objectives/{id} → 200 chi tiết KPI")
        void getKpi_returns200() throws Exception {
            KpiObjectiveDto.Response resp = KpiObjectiveDto.Response.builder()
                    .id(1L).name("Tăng doanh số 20%").build();
            Mockito.when(kpiService.getObjective(1L)).thenReturn(resp);

            mockMvc.perform(get("/api/v1/kpi-objectives/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(1));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("PUT /api/v1/kpi-objectives/{id} → 200 cập nhật KPI")
        void updateKpi_returns200() throws Exception {
            KpiObjectiveDto.Response resp = KpiObjectiveDto.Response.builder()
                    .id(1L).name("Tăng doanh số 25%").build();
            Mockito.when(kpiService.updateObjective(anyLong(), any())).thenReturn(resp);

            String body = """
                    {"name":"Tăng doanh số 25%","targetValue":25,
                     "periodStart":"2026-01-01","periodEnd":"2026-03-31"}
                    """;

            mockMvc.perform(put("/api/v1/kpi-objectives/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Tăng doanh số 25%"));
        }

        @Test
        @WithMockUser(username = "manager01", authorities = {"ROLE_MANAGER"})
        @DisplayName("DELETE /api/v1/kpi-objectives/{id} → 200 xóa KPI")
        void deleteKpi_returns200() throws Exception {
            Mockito.doNothing().when(kpiService).deleteObjective(1L);

            mockMvc.perform(delete("/api/v1/kpi-objectives/1").with(csrf()))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/kpi-objectives/summary → 200 tóm tắt KPI")
        void getKpiSummary_returns200() throws Exception {
            KpiObjectiveDto.ScopeHeader header = KpiObjectiveDto.ScopeHeader.builder().build();
            Mockito.when(kpiService.getSummary(isNull(), isNull(), isNull(), isNull())).thenReturn(header);

            mockMvc.perform(get("/api/v1/kpi-objectives/summary"))
                    .andExpect(status().isOk());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 8. ANNOUNCEMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("8. Announcements")
    class AnnouncementTests {

        @Test
        @WithMockUser(username = "admin", authorities = {"ROLE_ADMIN"})
        @DisplayName("POST /api/v1/announcements → 201 tạo thông báo")
        void createAnnouncement_returns201() throws Exception {
            CreateAnnouncementResponse resp = new CreateAnnouncementResponse();
            Mockito.when(announcementService.createAnnouncement(any())).thenReturn(resp);

            String body = """
                    {"title":"Thông báo nghỉ lễ","content":"Công ty nghỉ lễ 30/4",
                     "announcementType":"POLICY",
                     "targetAudience":"ALL_COMPANY","targetIds":[],"sendEmail":false}
                    """;

            mockMvc.perform(post("/api/v1/announcements").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("GET /api/v1/announcements/user/{userId} → 200 thông báo của người dùng")
        void getAnnouncementsForUser_returns200() throws Exception {
            AnnouncementResponse ann = new AnnouncementResponse();
            Mockito.when(announcementService.getAnnouncementsForUser(1L)).thenReturn(List.of(ann));

            mockMvc.perform(get("/api/v1/announcements/user/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(username = "emp01", authorities = {"ROLE_EMPLOYEE"})
        @DisplayName("PUT /api/v1/announcements/{id}/read → 200 đánh dấu đã đọc")
        void markAnnouncementRead_returns200() throws Exception {
            AnnouncementResponse ann = new AnnouncementResponse();
            Mockito.when(announcementService.markAnnouncementAsRead(anyLong(), anyLong())).thenReturn(ann);

            String body = """
                    {"userId":1}
                    """;

            mockMvc.perform(put("/api/v1/announcements/1/read").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
