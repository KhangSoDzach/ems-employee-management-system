package com.company.ems.backend.asset.incident.repository;

import com.company.ems.backend.asset.incident.entity.AssetIncidentReport;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AssetIncidentReportRepository extends JpaRepository<AssetIncidentReport, Long> {
    Optional<AssetIncidentReport> findByReportCode(String reportCode);

    @Query("""
        SELECT r FROM AssetIncidentReport r
        WHERE r.reportedBy.id = :employeeId
        ORDER BY r.reportedAt DESC
        """)
    Page<AssetIncidentReport> findByEmployee(
            @Param("employeeId") Long employeeId,
            Pageable pageable);

    @Query("""
        SELECT r FROM AssetIncidentReport r
        WHERE (:status IS NULL OR r.status = :status)
          AND (:employeeId IS NULL OR r.reportedBy.id = :employeeId)
          AND (:from IS NULL OR r.reportedAt >= :from)
          AND (:to IS NULL OR r.reportedAt <= :to)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(r.reportCode) LIKE LOWER(CONCAT('%',:keyword,'%'))
               OR LOWER(r.asset.assetName) LIKE LOWER(CONCAT('%',:keyword,'%')))
        ORDER BY r.reportedAt DESC
        """)
    Page<AssetIncidentReport> findAllFiltered(
            @Param("status")     ReportStatus status,
            @Param("employeeId") Long employeeId,
            @Param("from")       LocalDateTime from,
            @Param("to")         LocalDateTime to,
            @Param("keyword")    String keyword,
            Pageable pageable);

    @Query("SELECT COUNT(r) FROM AssetIncidentReport r WHERE r.reportCode LIKE :prefix%")
    long countByReportCodeStartingWith(@Param("prefix") String prefix);

    boolean existsByReportCode(String reportCode);
}