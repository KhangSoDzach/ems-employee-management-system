package com.company.ems.backend.auditlog.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.auditlog.entity.AuditLog;
import com.company.ems.backend.auditlog.enums.AuthActionType;

/**
 * Repository for AuditLog.
 * <p>
 * Security notice: No delete or update methods are exposed.
 * Audit records are append-only per AC-05.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Filtered, paginated query for Admin dashboard.
     * All filter parameters are optional (null = no filter applied).
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:entityType  IS NULL OR a.entityType = :entityType)
              AND (:actionType  IS NULL OR a.actionType = :actionType)
              AND (:actor       IS NULL OR a.actor       LIKE %:actor%)
              AND (:identifier  IS NULL OR a.identifierAttempted LIKE %:identifier%)
              AND (:ipAddress   IS NULL OR a.ipAddress   = :ipAddress)
              AND (:from        IS NULL OR a.createdAt  >= :from)
              AND (:to          IS NULL OR a.createdAt  <= :to)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findByFilters(
            @Param("entityType") String entityType,
            @Param("actionType") AuthActionType actionType,
            @Param("actor")      String actor,
            @Param("identifier") String identifier,
            @Param("ipAddress")  String ipAddress,
            @Param("from")       LocalDateTime from,
            @Param("to")         LocalDateTime to,
            Pageable pageable);
}
