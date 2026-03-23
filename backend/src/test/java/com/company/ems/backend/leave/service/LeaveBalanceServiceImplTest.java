package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveBalanceRepository;

@ExtendWith(MockitoExtension.class)
class LeaveBalanceServiceImplTest {

    @Mock
    private LeaveBalanceRepository leaveBalanceRepository;

    @Mock
    private LeaveMapper leaveMapper;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private LeaveBalanceServiceImpl leaveBalanceService;

    private LeaveBalance annualBalance;
    private final Long employeeId = 1L;
    private final int currentYear = LocalDate.now().getYear();

    @BeforeEach
    void setUp() {
        Employee employee = new Employee();
        employee.setId(employeeId);

        lenient().when(employeeRepository.getReferenceById(employeeId)).thenReturn(employee);
        lenient().when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        lenient().when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(leaveBalanceRepository.save(any(LeaveBalance.class))).thenAnswer(inv -> inv.getArgument(0));

        annualBalance = LeaveBalance.builder()
                .employee(employee)
                .leaveType(LeaveType.ANNUAL)
                .year(currentYear)
                .totalDays(12)
                .carriedForwardDays(2)
                .usedDays(3)
                .build();
        annualBalance.setId(100L);
        annualBalance.calculateRemainingDays();

        lenient().when(leaveMapper.toResponse(any(LeaveBalance.class))).thenAnswer(inv -> {
            LeaveBalance balance = inv.getArgument(0);
            return LeaveBalanceResponse.builder()
                    .id(balance.getId())
                    .leaveType(balance.getLeaveType() != null ? balance.getLeaveType().name() : null)
                    .totalDays(balance.getTotalDays())
                    .carriedForwardDays(balance.getCarriedForwardDays())
                    .usedDays(balance.getUsedDays())
                    .remainingDays(balance.getRemainingDays())
                    .build();
        });
    }

    @Test
    void getBalanceForEmployee_returnsMappedDtos() {
        when(leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear))
                .thenReturn(List.of(annualBalance));

        List<LeaveBalanceResponse> responses = leaveBalanceService.getBalanceForEmployee(employeeId);

        assertEquals(1, responses.size());
        LeaveBalanceResponse res = responses.get(0);
        assertEquals(LeaveType.ANNUAL.name(), res.getLeaveType());
        assertEquals(12, res.getTotalDays());
        assertEquals(2, res.getCarriedForwardDays());
        assertEquals(3, res.getUsedDays());
        assertEquals(11, res.getRemainingDays()); // (12 + 2) - 3 = 11
    }

    @Test
    void deductBalance_success() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.of(annualBalance));

        leaveBalanceService.deductBalance(employeeId, LeaveType.ANNUAL, 2);

        ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
        verify(leaveBalanceRepository).save(captor.capture());

        LeaveBalance saved = captor.getValue();
        assertEquals(5, saved.getUsedDays()); // 3 + 2
        assertEquals(9, saved.getRemainingDays()); // 14 - 5
        verify(employeeRepository, atLeastOnce()).save(any(Employee.class));
    }

    @Test
    void deductBalance_skipsWhenNoQuotaExists() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.UNPAID))
                .thenReturn(Optional.empty());

        leaveBalanceService.deductBalance(employeeId, LeaveType.UNPAID, 5);

        verify(leaveBalanceRepository, never()).save(any(LeaveBalance.class));
    }

    @Test
    void returnBalance_success() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.of(annualBalance));

        leaveBalanceService.returnBalance(employeeId, LeaveType.ANNUAL, 1);

        ArgumentCaptor<LeaveBalance> captor = ArgumentCaptor.forClass(LeaveBalance.class);
        verify(leaveBalanceRepository).save(captor.capture());

        LeaveBalance saved = captor.getValue();
        assertEquals(2, saved.getUsedDays()); // 3 - 1
        assertEquals(12, saved.getRemainingDays()); // 14 - 2
    }

    @Test
    void hasSufficientBalance_returnsTrueWhenEnough() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.of(annualBalance));

        boolean result = leaveBalanceService.hasSufficientBalance(employeeId, LeaveType.ANNUAL, 5);
        assertTrue(result);
    }

    @Test
    void hasSufficientBalance_returnsFalseWhenNotEnough() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.of(annualBalance));

        boolean result = leaveBalanceService.hasSufficientBalance(employeeId, LeaveType.ANNUAL, 12); // Needs 12, only
                                                                                                     // has 11
        assertFalse(result);
    }

    @Test
    void hasSufficientBalance_returnsTrueWhenNoQuotaException() {
        // e.g. for UNPAID where there is no pre-seeded balance record
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.UNPAID))
                .thenReturn(Optional.empty());

        boolean result = leaveBalanceService.hasSufficientBalance(employeeId, LeaveType.UNPAID, 10);
        assertTrue(result);
    }

    @Test
    void initializeDefaultBalancesForEmployee_createsAnnualWhenMissing() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.empty());
        when(leaveBalanceRepository.save(any(LeaveBalance.class))).thenAnswer(inv -> {
            LeaveBalance lb = inv.getArgument(0);
            lb.setId(999L);
            return lb;
        });

        leaveBalanceService.initializeDefaultBalancesForEmployee(employeeId, currentYear);

        verify(leaveBalanceRepository).save(any(LeaveBalance.class));
        verify(employeeRepository, atLeastOnce()).save(any(Employee.class));
    }

    @Test
    void getRemainingDays_returnsDefaultWhenAnnualMissing() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, currentYear, LeaveType.ANNUAL))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.empty());
        when(leaveBalanceRepository.save(any(LeaveBalance.class))).thenAnswer(inv -> inv.getArgument(0));

        int remaining = leaveBalanceService.getRemainingDays(employeeId, LeaveType.ANNUAL);

        assertEquals(12, remaining);
        verify(leaveBalanceRepository, atLeastOnce())
                .findByEmployeeIdAndYearAndLeaveType(anyLong(), anyInt(), eq(LeaveType.ANNUAL));
    }
}
