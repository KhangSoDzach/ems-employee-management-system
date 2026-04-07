package com.company.ems.backend.leave.service;

import java.util.List;

import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.enums.LeaveType;

/**
 * Service for reading and adjusting employee leave balances.
 */
public interface LeaveBalanceService {

    /**
     * Returns all leave balances for the current year for the given employee.
     */
    List<LeaveBalanceResponse> getBalanceForEmployee(Long employeeId);

    /**
     * Ensures default leave balances exist for a specific employee and year.
     */
    void initializeDefaultBalancesForEmployee(Long employeeId, int year);

    /**
     * Returns remaining days for an employee and leave type in current year.
     */
    int getRemainingDays(Long employeeId, LeaveType leaveType);

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

    /**
     * Reserves days from an employee's leave balance when a request is submitted.
     */
    void reserveBalance(Long employeeId, LeaveType leaveType, int days);

    /**
     * Unreserves days from an employee's leave balance when a request is rejected or cancelled.
     */
    void returnReservedBalance(Long employeeId, LeaveType leaveType, int days);
}
