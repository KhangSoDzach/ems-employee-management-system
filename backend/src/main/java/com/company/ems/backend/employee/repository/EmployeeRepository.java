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
import com.company.ems.backend.employee.enums.WorkStatus;
import com.company.ems.backend.position.entity.Position;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
        Optional<Employee> findByEmail(String email);

        Optional<Employee> findByEmployeeCode(String employeeCode);

        boolean existsByEmail(String email);

        boolean existsByNationalId(String nationalId);

        boolean existsBySocialSecurityNumber(String socialSecurityNumber);

        boolean existsByTaxId(String taxId);

        boolean existsByBankAccountNumber(String bankAccountNumber);

        @Query("SELECT MAX(e.employeeCode) FROM Employee e WHERE e.employeeCode LIKE :prefix%")
        String findMaxEmployeeCodeByPrefix(@Param("prefix") String prefix);

        boolean existsByEmployeeCode(String employeeCode);

        List<Employee> findAllByDepartment(Department department);

        List<Employee> findAllByPosition(Position position);

        List<Employee> findAllByStatus(String status);

        @Query("SELECT e FROM Employee e WHERE e.status = 'ACTIVE'")
        List<Employee> findAllActive();

        @Query("SELECT e FROM Employee e WHERE " +
                "(e.isDeleted IS NULL OR e.isDeleted = false) AND " +
                "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
                "AND (:positionId IS NULL OR e.position.id = :positionId) " +
                "AND (:status IS NULL OR e.workStatus = :status)")
        Page<Employee> searchEmployees(
                @Param("search") String search,
                @Param("departmentId") Long departmentId,
                @Param("positionId") Long positionId,
                @Param("status") WorkStatus status,
                Pageable pageable);

        @Query("SELECT e FROM Employee e WHERE " +
                "(e.isDeleted IS NULL OR e.isDeleted = false) AND " +
                "e.reportingManager.id = :managerId AND " +
                "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
                "AND (:positionId IS NULL OR e.position.id = :positionId) " +
                "AND (:status IS NULL OR e.workStatus = :status)")
        Page<Employee> searchEmployeesByManager(
                @Param("managerId") Long managerId,
                @Param("search") String search,
                @Param("departmentId") Long departmentId,
                @Param("positionId") Long positionId,
                @Param("status") WorkStatus status,
                Pageable pageable);

        @Query("SELECT e FROM Employee e WHERE " +
                "(e.isDeleted IS NULL OR e.isDeleted = false) AND " +
                "(e.reportingManager.id = :managerId OR e.id = :managerId) AND " +
                "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
                "AND (:positionId IS NULL OR e.position.id = :positionId) " +
                "AND (:status IS NULL OR e.workStatus = :status)")
        Page<Employee> searchEmployeesFor360ByManagerGroup(
                @Param("managerId") Long managerId,
                @Param("search") String search,
                @Param("departmentId") Long departmentId,
                @Param("positionId") Long positionId,
                @Param("status") WorkStatus status,
                Pageable pageable);

        @Query("SELECT e FROM Employee e WHERE e.hireDate BETWEEN :startDate AND :endDate")
        List<Employee> findEmployeesHiredBetween(
                @Param("startDate") LocalDate startDate,
                @Param("endDate") LocalDate endDate);

        @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId AND e.status = 'ACTIVE'")
        long countByDepartment(@Param("departmentId") Long departmentId);

        @Query("SELECT COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE'")
        long countActiveEmployees();

        @Query("SELECT e FROM Employee e WHERE e.user.id = :userId")
        Optional<Employee> findByUserId(@Param("userId") Long userId);

        @Query("SELECT DISTINCT e.department FROM Employee e WHERE e.department IS NOT NULL ORDER BY e.department.name")
        List<Department> findAllDepartments();

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

        @Query("SELECT e FROM Employee e WHERE e.reportingManager.id = :managerId AND e.status = 'ACTIVE'")
        List<Employee> findDirectReportsByManagerId(@Param("managerId") Long managerId);

        @Query("SELECT e FROM Employee e WHERE e.user.username = :username")
        Optional<Employee> findByUserUsername(@Param("username") String username);

        @Query("""
                        SELECT DISTINCT e.user.id
                        FROM Employee e
                        WHERE e.user IS NOT NULL
                                AND e.user.enabled = true
                                AND e.department.id IN :departmentIds
                                """)
        List<Long> findDistinctUserIdsByDepartmentIds(@Param("departmentIds") List<Long> departmentIds);

        @Query("SELECT e FROM Employee e WHERE " +
                "e.isDeleted = true AND " +
                "(:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) " +
                "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')))")
        Page<Employee> searchArchivedEmployees(
                @Param("search") String search,
                Pageable pageable);
}