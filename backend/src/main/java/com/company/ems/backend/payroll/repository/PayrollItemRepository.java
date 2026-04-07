package com.company.ems.backend.payroll.repository;

import com.company.ems.backend.payroll.entity.PayrollItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollItemRepository extends JpaRepository<PayrollItem, Long> {

    List<PayrollItem> findByPayrollId(Long payrollId);
    @Modifying
    @Query("DELETE FROM PayrollItem pi WHERE pi.payroll.id = :payrollId")
    void deleteByPayrollId(@Param("payrollId") Long payrollId);
}
