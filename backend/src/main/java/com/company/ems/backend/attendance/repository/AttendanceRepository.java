package com.company.ems.backend.attendance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.attendance.enums.AttendanceStatus;
import com.company.ems.backend.employee.entity.Employee;

/**
 * Repository interface for Attendance entity
 * Provides database operations for attendance management
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * Find attendance by employee and date
     */
    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);

    /**
     * Find attendance by employee ID and date (preferred — avoids loading the Employee entity).
     */
    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

    /**
     * Check if attendance exists for employee on specific date
     */
    boolean existsByEmployeeAndDate(Employee employee, LocalDate date);

    /**
     * Check attendance existence by employee ID (avoids loading the Employee entity).
     */
    boolean existsByEmployeeIdAndDate(Long employeeId, LocalDate date);

    /**
     * Find all attendances for an employee
     */
    List<Attendance> findAllByEmployee(Employee employee);

    /**
     * Find attendances for an employee within date range
     */
    @Query("SELECT a FROM Attendance a WHERE a.employee = :employee " +
           "AND a.date BETWEEN :startDate AND :endDate ORDER BY a.date DESC")
    List<Attendance> findByEmployeeAndDateBetween(
            @Param("employee") Employee employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find attendances by status
     */
    List<Attendance> findAllByStatus(String status);

    /**
     * Find attendances for a specific date
     */
    @Query("SELECT a FROM Attendance a WHERE a.date = :date ORDER BY a.checkInTime")
    List<Attendance> findAllByDate(@Param("date") LocalDate date);

    /**
     * Find late attendances
     */
    @Query("SELECT a FROM Attendance a WHERE a.isLate = true AND a.date BETWEEN :startDate AND :endDate")
    List<Attendance> findLateAttendances(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find overtime attendances
     */
    @Query("SELECT a FROM Attendance a WHERE a.isOvertime = true AND a.date BETWEEN :startDate AND :endDate")
    List<Attendance> findOvertimeAttendances(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find unchecked-out attendances (still at work)
     */
    @Query("SELECT a FROM Attendance a WHERE a.checkOutTime IS NULL AND a.date = :date")
    List<Attendance> findUncheckedOutByDate(@Param("date") LocalDate date);

    /**
     * Calculate total work hours for employee in date range
     */
    @Query("SELECT SUM(a.workHours) FROM Attendance a WHERE a.employee = :employee " +
           "AND a.date BETWEEN :startDate AND :endDate AND a.checkOutTime IS NOT NULL")
    Long calculateTotalWorkHours(
            @Param("employee") Employee employee,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Count attendances by employee and status
     */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.employee = :employee " +
           "AND a.status = :status AND a.date BETWEEN :startDate AND :endDate")
    long countByEmployeeAndStatusAndDateBetween(
            @Param("employee") Employee employee,
            @Param("status") AttendanceStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Search attendances with pagination
     */
    @Query("SELECT a FROM Attendance a WHERE " +
           "(:employeeId IS NULL OR a.employee.id = :employeeId) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:startDate IS NULL OR a.date >= :startDate) " +
           "AND (:endDate IS NULL OR a.date <= :endDate)")
    Page<Attendance> searchAttendances(
            @Param("employeeId") Long employeeId,
            @Param("status") AttendanceStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    /**
     * Find today's attendance for employee
     */
    @Query("SELECT a FROM Attendance a WHERE a.employee.id = :employeeId AND a.date = CURRENT_DATE")
    Optional<Attendance> findTodayAttendanceByEmployeeId(@Param("employeeId") Long employeeId);

    List<Attendance> findByEmployeeIdAndDateBetweenOrderByDateAsc(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate);

    long countByEmployeeIdAndDateBetweenAndCheckOutTimeIsNull(
            Long employeeId,
            LocalDate startDate,
            LocalDate endDate);
}
