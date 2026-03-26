package com.company.ems.backend.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.company.ems.backend.asset.incident.controller.MyAssetController;
import com.company.ems.backend.asset.request.controller.AdminAssetRequestController;
import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.service.AssetRequestService;
import com.company.ems.backend.attendance.controller.AttendanceAdjustmentController;
import com.company.ems.backend.attendance.service.AttendanceAdjustmentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.common.audit.SecurityAuditService;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.config.StorageProperties;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.controller.LeaveBalanceController;
import com.company.ems.backend.leave.service.LeaveBalanceService;
import com.company.ems.backend.rbac.evaluator.CustomPermissionEvaluator;
import com.company.ems.backend.rbac.service.DataScopeService;

@WebMvcTest(controllers = {
              LeaveBalanceController.class,
              AttendanceAdjustmentController.class,
              MyAssetController.class,
              AdminAssetRequestController.class
})
@AutoConfigureMockMvc(addFilters = false)
@Import({ StorageProperties.class })
public class SystemFeaturesE2ETest {

       @Autowired
       private MockMvc mockMvc;

       @MockitoBean
       private LeaveBalanceService leaveBalanceService;
       @MockitoBean
       private EmployeeRepository employeeRepository;
       @MockitoBean
       private AttendanceAdjustmentService adjustmentService;
       @MockitoBean
       private AssetRequestService assetRequestService;
       @MockitoBean
       private DataScopeService dataScopeService;
       @MockitoBean
       private com.company.ems.backend.asset.incident.service.IncidentService incidentService;

       @MockitoBean
       private JwtTokenUtil jwtTokenUtil;
       @MockitoBean
       private CustomUserDetailsService customUserDetailsService;
       @MockitoBean
       private MessageService messages;
       @MockitoBean
       private SecurityAuditService securityAuditService;
       @MockitoBean
       private CustomPermissionEvaluator customPermissionEvaluator;

       @BeforeEach
       void setup() {
              Mockito.when(messages.get(any(MessageCode.class)))
                            .thenReturn("Success");

              CustomUserPrincipal principal = new CustomUserPrincipal(1L, "emp01", "password", "Employee Member", true,
                            true, true, true, java.util.List.of(), java.util.Set.of());
              Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(principal);
       }

       @Test
       @WithMockUser(username = "emp01", authorities = { "ROLE_EMPLOYEE" })
       void e2eEmployeeCanAccessFeatures() throws Exception {

              // 1. Leave Balances check (no longer 403 because we mock
              // CustomPermissionEvaluator logic here)
              // Wait, @WithMockUser skips standard permission evaluator if we don't configure
              // it, but just in case:
              Mockito.when(customPermissionEvaluator.hasPermission(any(), any(), eq("LEAVE_VIEW")))
                            .thenReturn(true);
              Mockito.when(customPermissionEvaluator.hasPermission(any(), any(), eq("ATTENDANCE_ADJUSTMENT_REQUEST")))
                            .thenReturn(true);

              // We also need to mock EmployeeRepository returning the employee
              com.company.ems.backend.employee.entity.Employee employee = new com.company.ems.backend.employee.entity.Employee();
              employee.setId(10L);
              Mockito.when(employeeRepository.findByUserId(1L)).thenReturn(java.util.Optional.of(employee));

              mockMvc.perform(get("/api/v1/leave-balances"))
                            .andExpect(status().isOk());

              // 2. Attendance Adjustments check (no longer 500)
              mockMvc.perform(get("/api/v1/attendance/adjustments/my")
                            .param("page", "0")
                            .param("size", "10"))
                            .andExpect(status().isOk());

              // 3. Asset Requests check (no longer throwing 500 mapping error)
              mockMvc.perform(get("/api/v1/my/asset-requests")
                            .param("page", "0")
                            .param("size", "50"))
                            .andExpect(status().isOk());
       }

       @Test
       @WithMockUser(username = "admin", authorities = { "ROLE_ADMIN" })
       void e2eAdminCanAccessFeatures() throws Exception {
              // Mocking detailed view response
              AssetRequestDto.RequestDetail detail = new AssetRequestDto.RequestDetail();
              detail.setId(1L);
              detail.setRequestId("REQ-2024-001");

              Mockito.when(assetRequestService.getRequestDetail(1L)).thenReturn(detail);

              // Test GET detail endpoint
              mockMvc.perform(get("/api/v1/admin/asset-requests/1"))
                            .andExpect(status().isOk());
       }
}
