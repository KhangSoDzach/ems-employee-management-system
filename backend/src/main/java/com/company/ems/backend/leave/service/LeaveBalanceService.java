package com.company.ems.backend.leave.service;

import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.enums.LeaveType;

import java.util.List;

/**
 * Service for reading and adjusting employee leave balances.
 */
public interface LeaveBalanceService {

    /**
     * Returns all leave balances for the current year for the given employee.
     */
    List<LeaveBalanceResponse> getBalanceForEmployee(Long employeeId);

    /**
     * Deducts days from an employee's leave balance when a leave is approved.
     * Silently skips if no balance record exists (UNPAID / types without quota).
     */
    void deductBalance(Long employeeId, LeaveType leaveType, int days);

    /**
     * Returns days to an employee's leave balance when a leave is cancelled or
     * rejected.
     */
    void returnBalance(Long employeeId, LeaveType leaveType, int days);

    /**
     * Returns {@code true} if the employee has sufficient remaining balance.
     */
    boolean hasSufficientBalance(Long employeeId, LeaveType leaveType, int days);
}
