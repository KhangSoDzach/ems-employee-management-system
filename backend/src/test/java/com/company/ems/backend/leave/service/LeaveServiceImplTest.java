package com.company.ems.backend.leave.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;

@ExtendWith(MockitoExtension.class)
class LeaveServiceImplTest {

    @Mock
    private LeaveRepository leaveRepository;

    @Mock
    private LeaveMapper leaveMapper;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DataScopeService dataScopeService;

    @Mock
    private LeaveApprovalService leaveApprovalService;

        @Mock
        private WorkflowEngineService workflowEngineService;

    @InjectMocks
    private LeaveServiceImpl leaveService;

    @Test
    void approveLeave_mapsLegacyStatusAndDelegatesToWorkflowService() {
        CustomUserPrincipal principal = principalWithRoles(List.of("ROLE_MANAGER"));
        when(dataScopeService.getCurrentPrincipal()).thenReturn(principal);

        LeaveResponse delegated = LeaveResponse.builder().status("REJECTED").build();
        when(leaveApprovalService.processApproval(eq(1L), eq(2L), any(LeaveApprovalRequest.class)))
                .thenReturn(delegated);

        ApproveLeaveRequest request = ApproveLeaveRequest.builder()
                .status("REJECTED")
                .notes("Not available")
                .build();

        LeaveResponse response = leaveService.approveLeave(1L, request);

        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());

        ArgumentCaptor<LeaveApprovalRequest> requestCaptor = ArgumentCaptor.forClass(LeaveApprovalRequest.class);
        verify(leaveApprovalService).processApproval(eq(1L), eq(2L), requestCaptor.capture());
        assertEquals(LeaveApprovalAction.REJECT, requestCaptor.getValue().getAction());
        assertEquals("Not available", requestCaptor.getValue().getComments());
    }

    @Test
    void getPendingForApprover_usesAllApproverRolesForMultiLevelInbox() {
        CustomUserPrincipal principal = principalWithRoles(List.of("ROLE_MANAGER", "ROLE_HR"));
        when(dataScopeService.getCurrentPrincipal()).thenReturn(principal);

        Employee self = new Employee();
        self.setId(10L);
        when(employeeRepository.findByUserId(2L)).thenReturn(Optional.of(self));

        Leave pending = Leave.builder()
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .reason("Vacation")
                .status(LeaveStatus.PENDING_LEVEL_2)
                .currentApprovalLevel(2)
                .maxApprovalLevel(2)
                .longLeaveHrRequired(true)
                .build();
        pending.setId(99L);

        when(leaveRepository.findPendingForApprover(
                any(), any(), eq(2L), eq(10L), anyBoolean(), any()))
                        .thenReturn(new PageImpl<>(List.of(pending)));
        when(leaveMapper.toResponse(pending)).thenReturn(LeaveResponse.builder()
                .id(99L)
                .status("PENDING_LEVEL_2")
                .build());

        var result = leaveService.getPendingForApprover(0, 20);

        assertEquals(1, result.getContent().size());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> rolesCaptor = ArgumentCaptor.forClass(List.class);
        verify(leaveRepository).findPendingForApprover(
                any(), rolesCaptor.capture(), eq(2L), eq(10L), anyBoolean(), any());
        assertTrue(rolesCaptor.getValue().contains("ROLE_MANAGER"));
        assertTrue(rolesCaptor.getValue().contains("ROLE_HR"));
    }

    @Test
    void createLeaveRequest_fallsBackToSingleLevel_whenNoActiveWorkflowTemplate() {
        CustomUserPrincipal principal = principalWithRoles(List.of("ROLE_EMPLOYEE"));
        when(dataScopeService.getCurrentPrincipal()).thenReturn(principal);

        User user = User.builder().username("employee1").build();
        user.setId(2L);
        Employee employee = Employee.builder()
                .user(user)
                .firstName("Tran")
                .lastName("Dev")
                .build();
        employee.setId(10L);
        when(employeeRepository.findByUserId(2L)).thenReturn(Optional.of(employee));

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE))
                .thenThrow(new BusinessException("WORKFLOW_TEMPLATE_NOT_FOUND", "not configured"));

        when(leaveRepository.save(any(Leave.class))).thenAnswer(invocation -> {
            Leave leave = invocation.getArgument(0);
            leave.setId(123L);
            return leave;
        });
        when(leaveMapper.toResponse(any(Leave.class))).thenAnswer(invocation -> {
            Leave leave = invocation.getArgument(0);
            return LeaveResponse.builder()
                    .id(leave.getId())
                    .status(leave.getStatus().name())
                    .currentApprovalLevel(leave.getCurrentApprovalLevel())
                    .maxApprovalLevel(leave.getMaxApprovalLevel())
                    .build();
        });

        LeaveRequest request = LeaveRequest.builder()
                .employeeId(10L)
                .leaveType("ANNUAL")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .reason("Vacation")
                .build();

        LeaveResponse response = leaveService.createLeaveRequest(request);

        assertNotNull(response);
        assertEquals("PENDING_LEVEL_1", response.getStatus());
        assertEquals(1, response.getCurrentApprovalLevel());
        assertEquals(1, response.getMaxApprovalLevel());
        verify(leaveApprovalService, never()).initialiseApprovalLevels(any(), any());
    }

    private CustomUserPrincipal principalWithRoles(List<String> roleAuthorities) {
        List<SimpleGrantedAuthority> authorities = roleAuthorities.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        return new CustomUserPrincipal(
                2L,
                "manager",
                "pwd",
                true,
                true,
                true,
                true,
                authorities,
                Set.of(DataScope.TEAM));
    }
}