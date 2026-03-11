package com.company.ems.backend.employee.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.position.entity.Position;

/**
 * Repository interface for Employee entity
 * Provides database operations for employee management
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

        /**
         * Find employee by email
         */
        Optional<Employee> findByEmail(String email);

        /**
         * Find employee by employee code
         */
        Optional<Employee> findByEmployeeCode(String employeeCode);

        /**
         * Check if email exists
         */
        boolean existsByEmail(String email);

        /**
         * Check if national ID exists
         */
        boolean existsByNationalId(String nationalId);

        /**
         * Get max employee code by prefix
         */
        @Query("SELECT MAX(e.employeeCode) FROM Employee e WHERE e.employeeCode LIKE :prefix%")
        String findMaxEmployeeCodeByPrefix(@Param("prefix") String prefix);

        /**
         * Check if employee code exists
         */
        boolean existsByEmployeeCode(String employeeCode);

        /**
         * Find employees by department
         */
        List<Employee> findAllByDepartment(Department department);

        /**
         * Find employees by position
         */
        List<Employee> findAllByPosition(Position position);

        /**
         * Find employees by status
         */
        List<Employee> findAllByStatus(String status);

        /**
         * Find active employees
         */
        @Query("SELECT e FROM Employee e WHERE e.status = 'ACTIVE'")
        List<Employee> findAllActive();

        /**
         * Search employees with filters
         */
        @Query("SELECT e FROM Employee e WHERE " +
                        "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
                        "AND (:positionId IS NULL OR e.position.id = :positionId) " +
                        "AND (:status IS NULL OR e.status = :status)")
        Page<Employee> searchEmployees(
                        @Param("search") String search,
                        @Param("departmentId") Long departmentId,
                        @Param("positionId") Long positionId,
                        @Param("status") EmployeeStatus status,
                        Pageable pageable);

        @Query("SELECT e FROM Employee e WHERE " +
                        "e.reportingManager.id = :managerId AND " +
                        "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                        "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
                        "AND (:positionId IS NULL OR e.position.id = :positionId) " +
                        "AND (:status IS NULL OR e.status = :status)")
        Page<Employee> searchEmployeesByManager(
                        @Param("managerId") Long managerId,
                        @Param("search") String search,
                        @Param("departmentId") Long departmentId,
                        @Param("positionId") Long positionId,
                        @Param("status") EmployeeStatus status,
                        Pageable pageable);

        /**
         * Find employees hired within a date range
         */
        @Query("SELECT e FROM Employee e WHERE e.hireDate BETWEEN :startDate AND :endDate")
        List<Employee> findEmployeesHiredBetween(
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        /**
         * Count employees by department
         */
        @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId AND e.status = 'ACTIVE'")
        long countByDepartment(@Param("departmentId") Long departmentId);

        /**
         * Count total active employees
         */
        @Query("SELECT COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE'")
        long countActiveEmployees();

        /**
         * Find employee by user ID
         */
        @Query("SELECT e FROM Employee e WHERE e.user.id = :userId")
        Optional<Employee> findByUserId(@Param("userId") Long userId);

        /**
         * Get all distinct departments
         */
        @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL ORDER BY e.department.name")
        List<Department> findAllDepartments();

        /**
         * Get all distinct positions
         */
        @Query("SELECT DISTINCT e.position FROM Employee e WHERE e.position IS NOT NULL ORDER BY e.position.title")
        List<Position> findAllPositions();

        @Query("""
                        SELECT e.id
                        FROM Employee e
                        WHERE e.user.id = :userId
                        """)
        Optional<Long> findEmployeeIdByUserId(@Param("userId") Long userId);

        @Query("""
                        SELECT e.department.id
                        FROM Employee e
                        WHERE e.user.id = :userId
                        """)
        Optional<Long> findDepartmentIdByUserId(@Param("userId") Long userId);
}
