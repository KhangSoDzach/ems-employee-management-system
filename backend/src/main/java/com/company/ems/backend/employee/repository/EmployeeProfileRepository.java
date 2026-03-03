package com.company.ems.backend.employee.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.employee.dto.EmployeeProfileProjection;
import com.company.ems.backend.employee.entity.Employee;

@Repository
@Transactional(readOnly = true)
public interface EmployeeProfileRepository extends JpaRepository<Employee, Long> {

    String PROFILE_SELECT = """
            SELECT
                e.id              AS id,
                e.employeeCode    AS employeeCode,
                e.firstName       AS firstName,
                e.lastName        AS lastName,
                e.email           AS email,
                e.phone           AS phone,
                d.name            AS departmentName,
                p.title           AS positionTitle,
                e.hireDate        AS hireDate,
                e.status          AS status,
                e.avatarUrl       AS avatarUrl,
                e.workLocation    AS workLocation
            FROM Employee e
            LEFT JOIN e.department d
            LEFT JOIN e.position   p
            """;
    @Query(PROFILE_SELECT + """
            WHERE e.user.id = :userId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Optional<EmployeeProfileProjection> findProfileByUserId(@Param("userId") Long userId);

    @Query(PROFILE_SELECT + """
            WHERE e.id = :employeeId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Optional<EmployeeProfileProjection> findProfileById(@Param("employeeId") Long employeeId);

    @Query(PROFILE_SELECT + """
            WHERE e.reportingManager.user.id = :managerUserId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Page<EmployeeProfileProjection> findTeamProfiles(
            @Param("managerUserId") Long managerUserId,
            Pageable pageable);

    @Query(PROFILE_SELECT + """
            WHERE (e.isDeleted = false OR e.isDeleted IS NULL)
              AND (:search IS NULL
                   OR LOWER(e.firstName)    LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(e.lastName)     LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(e.email)        LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR CAST(e.status AS string) = :status)
            """)
    Page<EmployeeProfileProjection> findAllProfiles(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable);

    @Query("""
            SELECT COUNT(e) > 0
            FROM Employee e
            WHERE e.id = :employeeId
              AND e.reportingManager.user.id = :managerUserId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    boolean isEmployeeInManagerTeam(
            @Param("employeeId")    Long employeeId,
            @Param("managerUserId") Long managerUserId);

    @Query("""
            SELECT e.id FROM Employee e
            WHERE e.user.id = :userId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Optional<Long> findEmployeeIdByUserId(@Param("userId") Long userId);
}