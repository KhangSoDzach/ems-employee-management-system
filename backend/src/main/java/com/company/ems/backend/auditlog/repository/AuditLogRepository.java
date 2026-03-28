package com.company.ems.backend.auditlog.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.ems.backend.auditlog.entity.AuditLog;
import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.ResourceType;

/**
 * Repository for AuditLog providing standardized queries.
 * Updated for ResourceType and Action classification.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

        /**
         * Anti-spam check: Finds the most recent similar event.
         */
        @Query(value = "SELECT * FROM audit_log a WHERE a.actor = :actor AND a.ip_address = :ip AND a.action = :action AND a.created_at >= :since ORDER BY a.created_at DESC LIMIT 1", nativeQuery = true)
        Optional<AuditLog> findLastSameEvent(
                        @Param("actor") String actor,
                        @Param("ip") String ip,
                        @Param("action") String action,
                        @Param("since") LocalDateTime since);

        /**
         * Finds last same event using JPQL.
         */
        @Query("SELECT a FROM AuditLog a WHERE a.actor = :actor AND a.ipAddress = :ip AND a.action = :action AND a.createdAt >= :since ORDER BY a.createdAt DESC")
        java.util.List<AuditLog> findLastEventsJPQL(
                        @Param("actor") String actor,
                        @Param("ip") String ip,
                        @Param("action") AuditAction action,
                        @Param("since") LocalDateTime since,
                        Pageable pageable);

        default Optional<AuditLog> findLastSameEvent(String actor, String ip, AuditAction action, LocalDateTime since) {
                return findLastEventsJPQL(actor, ip, action, since,
                                org.springframework.data.domain.PageRequest.of(0, 1))
                                .stream().findFirst();
        }

        /**
         * Filtered query for production Audit Log dashboard.
         */
        @Query("""
                        SELECT a FROM AuditLog a
                        WHERE (:resource   IS NULL OR a.resource = :resource)
                          AND (:action     IS NULL OR a.action   = :action)
                          AND (:actor      IS NULL OR a.actor    LIKE %:actor%)
                          AND (:identifier IS NULL OR a.identifier LIKE %:identifier%)
                          AND (:ipAddress  IS NULL OR a.ipAddress = :ipAddress)
                          AND (:from       IS NULL OR a.createdAt >= :from)
                          AND (:to         IS NULL OR a.createdAt <= :to)
                          AND (:showAnonymous = true OR a.actor != 'ANONYMOUS')
                        ORDER BY a.createdAt DESC
                        """)
        Page<AuditLog> findByFilters(
                        @Param("resource") ResourceType resource,
                        @Param("action") AuditAction action,
                        @Param("actor") String actor,
                        @Param("identifier") String identifier,
                        @Param("ipAddress") String ipAddress,
                        @Param("from") LocalDateTime from,
                        @Param("to") LocalDateTime to,
                        @Param("showAnonymous") boolean showAnonymous,
                        Pageable pageable);
}
