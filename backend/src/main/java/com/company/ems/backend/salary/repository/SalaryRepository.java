package com.company.ems.backend.salary.repository;

import com.company.ems.backend.salary.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    @Query("""
           SELECT s FROM Salary s
           WHERE s.employee.id = :empId
             AND s.effectiveFrom <= :date
             AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date)
           ORDER BY s.effectiveFrom DESC
           """)
    Optional<Salary> findActiveByEmployeeAndDate(
            @Param("empId") Long employeeId,
            @Param("date")  LocalDate date);
}
