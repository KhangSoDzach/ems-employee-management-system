package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class LeaveServiceImplTest {

    @Mock
    private LeaveRepository leaveRepository;

    @Mock
    private LeaveMapper leaveMapper;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DataScopeService dataScopeService;

    @Mock
    private MessageService messages;

    @InjectMocks
    private LeaveServiceImpl leaveService;

    private CustomUserPrincipal managerPrincipal;

    @BeforeEach
    void setUp() {
        managerPrincipal = new CustomUserPrincipal(2L, "manager", "pwd", true, true, true, true,
                java.util.Collections.emptyList(), java.util.Set.of(com.company.ems.backend.user.enums.DataScope.TEAM));

        lenient().when(leaveMapper.toResponse(any(Leave.class))).thenAnswer(inv -> {
            Leave leave = inv.getArgument(0);
            return com.company.ems.backend.leave.dto.LeaveResponse.builder()
                    .status(leave.getStatus() != null ? leave.getStatus().name() : null)
                    .build();
        });
    }

    @Test
    void rejectLeave_ByManager_Succeeds() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(managerPrincipal);
        doNothing().when(dataScopeService).assertCanApproveLeave(managerPrincipal, 1L);

        Employee emp = new Employee();
        emp.setId(10L);

        Leave leave = Leave.builder()
                .employee(emp)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .reason("Vacation")
                .status(LeaveStatus.PENDING_LEVEL_1)
                .build();

        when(leaveRepository.findById(1L)).thenReturn(Optional.of(leave));
        when(leaveRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        User approver = User.builder().username("manager").password("x").email("m@x.com").build();
        when(userRepository.findById(managerPrincipal.getUserId())).thenReturn(Optional.of(approver));

        ApproveLeaveRequest req = ApproveLeaveRequest.builder()
                .status("REJECTED")
                .notes("Not available")
                .build();

        var resp = leaveService.approveLeave(1L, req);

        assertNotNull(resp);
        assertEquals("REJECTED", resp.getStatus());
        verify(leaveRepository, times(1)).save(leave);
    }
}
