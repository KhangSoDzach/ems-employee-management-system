package com.company.ems.backend.leave.repository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.enums.LeaveType;

@ExtendWith(MockitoExtension.class)
class LeaveBalanceRepositoryTest {

    @Mock
    private LeaveBalanceRepository leaveBalanceRepository;

    @Test
    void findByEmployeeIdAndYearAndLeaveType_shouldReturnRecordWhenExists() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(1L, 2026, LeaveType.ANNUAL))
                .thenReturn(Optional.of(new LeaveBalance()));

        assertTrue(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(1L, 2026, LeaveType.ANNUAL).isPresent());
    }

    @Test
    void findByEmployeeIdAndYearAndLeaveType_shouldReturnEmptyWhenMissing() {
        when(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(1L, 2026, LeaveType.SICK))
                .thenReturn(Optional.empty());

        assertFalse(leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(1L, 2026, LeaveType.SICK).isPresent());
    }
}
