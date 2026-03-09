package com.company.ems.backend.leave.repository;

import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.enums.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for leave balance records.
 */
@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    /**
     * Find balance for a specific employee, year and leave type.
     */
    Optional<LeaveBalance> findByEmployeeIdAndYearAndLeaveType(
            Long employeeId, Integer year, LeaveType leaveType);

    /**
     * Find all balance records for an employee in a given year.
     */
    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    /**
     * Find all balance records for an employee.
     */
    List<LeaveBalance> findByEmployeeId(Long employeeId);
}
