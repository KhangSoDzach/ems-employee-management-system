package com.company.ems.backend.leave.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.leave.dto.LeaveApprovalRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.entity.LeaveApprovalHistory;
import com.company.ems.backend.leave.enums.LeaveApprovalAction;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveApprovalHistoryRepository;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.AssigneeType;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveApprovalServiceImplTest {

    @Mock
    private LeaveRepository leaveRepository;
    @Mock
    private LeaveMapper leaveMapper;
    @Mock
    private LeaveApprovalHistoryRepository leaveApprovalHistoryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WorkflowEngineService workflowEngineService;
    @Mock
    private LeaveBalanceService leaveBalanceService;

    @InjectMocks
    private LeaveApprovalServiceImpl leaveApprovalService;

    private Leave leave;
    private final Long leaveId = 1L;
    private final Long approverId = 99L;
    private WorkflowTemplate template;
    private WorkflowLevel l1;
    private WorkflowLevel l2;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(leaveApprovalService, "longLeaveThresholdDays", 5);
        ReflectionTestUtils.setField(leaveApprovalService, "longLeaveExtraLevelRole", "ROLE_HR");

        Employee employee = new Employee();
        employee.setId(10L);

        leave = Leave.builder()
                .employee(employee)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .status(LeaveStatus.PENDING_LEVEL_1)
                .build();
        leave.setId(leaveId);
        leave.calculateTotalDays(); // 2 days
        leave.setCurrentApprovalLevel(1);
        leave.setMaxApprovalLevel(2);
        leave.setWorkflowTemplateId(100L);

        template = new WorkflowTemplate();
        template.setId(100L);
        l1 = new WorkflowLevel();
        l1.setLevelNumber(1);
        l1.setAssigneeType(AssigneeType.ROLE);
        l1.setAssigneeRole("ROLE_MANAGER");
        l2 = new WorkflowLevel();
        l2.setLevelNumber(2);
        l2.setAssigneeType(AssigneeType.ROLE);
        l2.setAssigneeRole("ROLE_ADMIN");
        template.setLevels(List.of(l1, l2));

        User approver = new User();
        approver.setId(approverId);
        approver.setUsername("approver");

        lenient().when(leaveRepository.findById(leaveId)).thenReturn(Optional.of(leave));
        lenient().when(userRepository.findById(approverId)).thenReturn(Optional.of(approver));
        lenient().when(leaveMapper.toResponse(any(Leave.class))).thenAnswer(inv -> {
            Leave entity = inv.getArgument(0);
            return LeaveResponse.builder()
                    .id(entity.getId())
                    .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                    .currentApprovalLevel(entity.getCurrentApprovalLevel())
                    .maxApprovalLevel(entity.getMaxApprovalLevel())
                    .build();
        });
    }

    @Test
    void processApproval_approveLevel1_movesToLevel2() {
        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.APPROVE);
        req.setComments("OK Level 1");

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 1)).thenReturn(Optional.of(l1));
        when(workflowEngineService.resolveApproverUserIds(l1)).thenReturn(List.of(approverId));
        when(leaveRepository.save(any(Leave.class))).thenAnswer(i -> i.getArgument(0));

        LeaveResponse res = leaveApprovalService.processApproval(leaveId, approverId, req);

        assertEquals(LeaveStatus.PENDING_LEVEL_2.name(), res.getStatus());
        assertEquals(2, res.getCurrentApprovalLevel());
        verify(leaveBalanceService, never()).deductBalance(any(), any(), anyInt());
        verify(leaveApprovalHistoryRepository).save(any(LeaveApprovalHistory.class));
    }

    @Test
    void processApproval_approveLastLevel_setsApprovedAndDeductsBalance() {
        leave.setCurrentApprovalLevel(2); // At last level
        leave.setStatus(LeaveStatus.PENDING_LEVEL_2);

        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.APPROVE);
        req.setComments("Final OK");

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 2)).thenReturn(Optional.of(l2));
        when(workflowEngineService.resolveApproverUserIds(l2)).thenReturn(List.of(approverId));
        when(leaveRepository.save(any(Leave.class))).thenAnswer(i -> i.getArgument(0));

        LeaveResponse res = leaveApprovalService.processApproval(leaveId, approverId, req);

        assertEquals(LeaveStatus.APPROVED.name(), res.getStatus());
        assertEquals(2, res.getCurrentApprovalLevel());
        verify(leaveBalanceService).deductBalance(leave.getEmployee().getId(), LeaveType.ANNUAL, 2);
    }

    @Test
    void processApproval_approveLastLevel_throwsWhenBalanceDeductionFails() {
        leave.setCurrentApprovalLevel(2); // At last level
        leave.setStatus(LeaveStatus.PENDING_LEVEL_2);

        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.APPROVE);
        req.setComments("Final OK");

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 2)).thenReturn(Optional.of(l2));
        when(workflowEngineService.resolveApproverUserIds(l2)).thenReturn(List.of(approverId));
        doThrow(new RuntimeException("Balance update failed"))
                .when(leaveBalanceService)
                .deductBalance(leave.getEmployee().getId(), LeaveType.ANNUAL, 2);

        assertThrows(RuntimeException.class, () -> leaveApprovalService.processApproval(leaveId, approverId, req));
        verify(leaveRepository, never()).save(any(Leave.class));
        verify(leaveApprovalHistoryRepository, never()).save(any(LeaveApprovalHistory.class));
    }

    @Test
    void processApproval_reject_setsRejected() {
        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.REJECT);
        req.setComments("No way");

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 1)).thenReturn(Optional.of(l1));
        when(workflowEngineService.resolveApproverUserIds(l1)).thenReturn(List.of(approverId));
        when(leaveRepository.save(any(Leave.class))).thenAnswer(i -> i.getArgument(0));

        LeaveResponse res = leaveApprovalService.processApproval(leaveId, approverId, req);

        assertEquals(LeaveStatus.REJECTED.name(), res.getStatus());
    }

    @Test
    void processApproval_sendBack_setsReturnedToEmployee() {
        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.SEND_BACK);
        req.setComments("Fix dates");

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 1)).thenReturn(Optional.of(l1));
        when(workflowEngineService.resolveApproverUserIds(l1)).thenReturn(List.of(approverId));
        when(leaveRepository.save(any(Leave.class))).thenAnswer(i -> i.getArgument(0));

        LeaveResponse res = leaveApprovalService.processApproval(leaveId, approverId, req);

        assertEquals(LeaveStatus.RETURNED_TO_EMPLOYEE.name(), res.getStatus());
        assertEquals(1, res.getCurrentApprovalLevel()); // Reset to level 1 implicitly
    }

    @Test
    void processApproval_throwsForbiddenWhenNotApprover() {
        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.APPROVE);

        when(workflowEngineService.getActiveTemplate(WorkflowType.LEAVE)).thenReturn(template);
        when(workflowEngineService.getLevel(template, 1)).thenReturn(Optional.of(l1));
        // Returns empty list or someone else's ID
        when(workflowEngineService.resolveApproverUserIds(l1)).thenReturn(List.of(88L));

        assertThrows(ForbiddenException.class, () -> leaveApprovalService.processApproval(leaveId, approverId, req));
    }

    @Test
    void processApproval_throwsExceptionWhenNotInPendingState() {
        leave.setStatus(LeaveStatus.APPROVED);

        LeaveApprovalRequest req = new LeaveApprovalRequest();
        req.setAction(LeaveApprovalAction.APPROVE);

        assertThrows(BusinessException.class, () -> leaveApprovalService.processApproval(leaveId, approverId, req));
    }

    @Test
    void initialiseApprovalLevels_autoAddsHrLevel_whenLongLeave() {
        // Leave is >= 5 days
        leave.setEndDate(LocalDate.now().plusDays(6));
        leave.calculateTotalDays(); // 6 days

        // Template only has 1 level (Manager)
        WorkflowTemplate shortTemplate = new WorkflowTemplate();
        WorkflowLevel l1 = new WorkflowLevel();
        l1.setLevelNumber(1);
        l1.setAssigneeRole("ROLE_MANAGER");
        shortTemplate.setLevels(List.of(l1));

        lenient().when(workflowEngineService.getLevels(shortTemplate)).thenReturn(shortTemplate.getLevels());

        leaveApprovalService.initialiseApprovalLevels(leave, shortTemplate);

        assertEquals(1, leave.getCurrentApprovalLevel());
        assertEquals(2, leave.getMaxApprovalLevel()); // HR level automatically injected
        assertTrue(leave.getLongLeaveHrRequired());
        assertEquals(LeaveStatus.PENDING_LEVEL_1, leave.getStatus());
    }

    @Test
    void initialiseApprovalLevels_doesNotAddHrLevel_whenShortLeave() {
        // Leave is 2 days (< 5)
        WorkflowTemplate shortTemplate = new WorkflowTemplate();
        WorkflowLevel l1 = new WorkflowLevel();
        l1.setLevelNumber(1);
        l1.setAssigneeRole("ROLE_MANAGER");
        shortTemplate.setLevels(List.of(l1));

        lenient().when(workflowEngineService.getLevels(shortTemplate)).thenReturn(shortTemplate.getLevels());

        leaveApprovalService.initialiseApprovalLevels(leave, shortTemplate);

        assertEquals(1, leave.getMaxApprovalLevel());
        assertFalse(leave.getLongLeaveHrRequired());
    }

    @Test
    void initialiseApprovalLevels_doesNotDoubleHrLevel_whenTemplateHasHrLast() {
        // Leave is >= 5 days
        leave.setEndDate(LocalDate.now().plusDays(6));
        leave.calculateTotalDays();

        // Template already has HR as last level
        WorkflowTemplate hrTemplate = new WorkflowTemplate();
        WorkflowLevel l1 = new WorkflowLevel();
        l1.setLevelNumber(1);
        l1.setAssigneeType(AssigneeType.ROLE);
        l1.setAssigneeRole("ROLE_MANAGER");
        WorkflowLevel hr = new WorkflowLevel();
        hr.setLevelNumber(2);
        hr.setAssigneeType(AssigneeType.ROLE);
        hr.setAssigneeRole("ROLE_HR");
        hrTemplate.setLevels(List.of(l1, hr));

        lenient().when(workflowEngineService.getLevels(hrTemplate)).thenReturn(hrTemplate.getLevels());

        leaveApprovalService.initialiseApprovalLevels(leave, hrTemplate);

        assertEquals(2, leave.getMaxApprovalLevel()); // Not 3!
        assertFalse(leave.getLongLeaveHrRequired()); // Pre-existing, not synthetically added
    }
}
