package com.company.ems.backend.leave.repository;

import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.leave.entity.Leave;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for Leave entity
 * Provides database operations for leave management
 */
@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {

    /**
     * Find all leaves for an employee
     */
    List<Leave> findAllByEmployee(Employee employee);

    /**
     * Find leaves by employee and status
     */
    List<Leave> findAllByEmployeeAndStatus(Employee employee, String status);

    /**
     * Find leaves by status
     */
    List<Leave> findAllByStatus(String status);

    /**
     * Find pending leaves
     */
    @Query("SELECT l FROM Leave l WHERE l.status = 'PENDING' ORDER BY l.createdAt ASC")
    List<Leave> findAllPendingLeaves();

    /**
     * Find leaves within date range
     */
    @Query("SELECT l FROM Leave l WHERE " +
           "(l.startDate BETWEEN :startDate AND :endDate) " +
           "OR (l.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN l.startDate AND l.endDate)")
    List<Leave> findLeavesInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find active leaves for a specific date
     */
    @Query("SELECT l FROM Leave l WHERE l.status = 'APPROVED' " +
           "AND :date BETWEEN l.startDate AND l.endDate")
    List<Leave> findActiveLeavesOnDate(@Param("date") LocalDate date);

    /**
     * Check if employee has overlapping leaves
     */
    @Query("SELECT COUNT(l) > 0 FROM Leave l WHERE l.employee = :employee " +
           "AND l.status IN ('PENDING', 'APPROVED') " +
           "AND ((l.startDate BETWEEN :startDate AND :endDate) " +
           "OR (l.endDate BETWEEN :startDate AND :endDate) " +
           "OR (:startDate BETWEEN l.startDate AND l.endDate))")
    boolean hasOverlappingLeaves(
            @Param("employee") Employee employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Calculate total leave days for employee by type and year
     */
    @Query("SELECT COALESCE(SUM(l.totalDays), 0) FROM Leave l WHERE l.employee = :employee " +
           "AND l.leaveType = :leaveType " +
           "AND l.status = 'APPROVED' " +
           "AND YEAR(l.startDate) = :year")
    Integer calculateTotalLeaveDaysByTypeAndYear(
            @Param("employee") Employee employee,
            @Param("leaveType") String leaveType,
            @Param("year") int year
    );

    /**
     * Calculate total leave days for employee in date range
     */
    @Query("SELECT COALESCE(SUM(l.totalDays), 0) FROM Leave l WHERE l.employee = :employee " +
           "AND l.status = 'APPROVED' " +
           "AND l.startDate BETWEEN :startDate AND :endDate")
    Integer calculateTotalLeaveDays(
            @Param("employee") Employee employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find leaves by type
     */
    List<Leave> findAllByLeaveType(String leaveType);

    /**
     * Search leaves with pagination
     */
    @Query("SELECT l FROM Leave l WHERE " +
           "(:employeeId IS NULL OR l.employee.id = :employeeId) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:leaveType IS NULL OR l.leaveType = :leaveType) " +
           "AND (:startDate IS NULL OR l.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR l.endDate <= :endDate)")
    Page<Leave> searchLeaves(
            @Param("employeeId") Long employeeId,
            @Param("status") String status,
            @Param("leaveType") String leaveType,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    /**
     * Count leaves by employee and status
     */
    long countByEmployeeAndStatus(Employee employee, String status);

    /**
     * Find upcoming approved leaves
     */
    @Query("SELECT l FROM Leave l WHERE l.status = 'APPROVED' " +
           "AND l.startDate >= CURRENT_DATE ORDER BY l.startDate ASC")
    List<Leave> findUpcomingApprovedLeaves();

    /**
     * Find leaves approved by a specific user
     */
    @Query("SELECT l FROM Leave l WHERE l.approvedBy.id = :userId ORDER BY l.approvedAt DESC")
    List<Leave> findLeavesApprovedByUser(@Param("userId") Long userId);

    @Query("SELECT l FROM Leave l WHERE l.employee.id = :employeeId ORDER BY l.createdAt DESC")
    Page<Leave> findByEmployeeId(@Param("employeeId") Long employeeId, Pageable pageable);

    @Query("SELECT l FROM Leave l WHERE l.employee.reportingManager.user.id = :managerUserId ORDER BY l.createdAt DESC")
    Page<Leave> findByReportingManagerUserId(@Param("managerUserId") Long managerUserId, Pageable pageable);
}
