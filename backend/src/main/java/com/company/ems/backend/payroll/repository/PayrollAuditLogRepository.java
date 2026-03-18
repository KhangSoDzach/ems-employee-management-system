package com.company.ems.backend.payroll.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.payroll.entity.AuditLog;

@Repository
public interface PayrollAuditLogRepository extends JpaRepository<AuditLog, Long> {
}
