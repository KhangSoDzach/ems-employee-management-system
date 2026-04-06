package com.company.ems.backend.payroll.repository;

import com.company.ems.backend.payroll.entity.Payroll;
import jakarta.persistence.QueryHint;
import org.hibernate.jpa.HibernateHints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    @Query("SELECT p FROM Payroll p " +
            "WHERE p.employee.id = :empId " +
            "AND p.isDeleted = false " +
            "ORDER BY p.payrollYear DESC, p.payrollMonth DESC")
    List<Payroll> findAllByEmployeeIdOrderByDesc(@Param("empId") Long employeeId);

    @Query("SELECT p FROM Payroll p " +
            "WHERE p.employee.id = :empId " +
            "AND p.payrollMonth = :month " +
            "AND p.payrollYear = :year")
    Optional<Payroll> findByEmployeeIdAndPeriod(
            @Param("empId") Long employeeId,
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "LEFT JOIN FETCH e.department " +
            "LEFT JOIN FETCH e.position " +
            "WHERE p.payrollMonth = :month " +
            "AND p.payrollYear = :year " +
            "ORDER BY e.lastName, e.firstName")
    List<Payroll> findByPeriodWithEmployee(
            @Param("month") int month,
            @Param("year") int year);

    @QueryHints(@QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "100"))
    @Query("SELECT p FROM Payroll p " +
            "JOIN FETCH p.employee e " +
            "LEFT JOIN FETCH e.department " +
            "LEFT JOIN FETCH e.position " +
            "WHERE p.payrollMonth = :month " +
            "AND p.payrollYear = :year " +
            "ORDER BY e.lastName, e.firstName")
    Stream<Payroll> streamByPeriod(
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT COALESCE(SUM(p.netPay), 0) FROM Payroll p " +
            "WHERE p.payrollMonth = :month AND p.payrollYear = :year")
    BigDecimal sumNetPayByPeriod(
            @Param("month") int month,
            @Param("year") int year);

    @Query("SELECT COUNT(p) > 0 FROM Payroll p " +
            "WHERE p.payrollMonth = :month AND p.payrollYear = :year")
    boolean existsByPeriod(
            @Param("month") int month,
            @Param("year") int year);
}
