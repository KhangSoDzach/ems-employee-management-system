package com.company.ems.backend.audit.repository;

import com.company.ems.backend.audit.entity.AuditLog;
import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
@Transactional(readOnly = true)
public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:userId IS NULL OR a.userId = :userId)
              AND (:fromDate IS NULL OR a.createdAt >= :fromDate)
              AND (:toDate   IS NULL OR a.createdAt <= :toDate)
              AND (:result   IS NULL OR a.result = :result)
              AND (:actionType IS NULL OR a.actionType = :actionType)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> findWithFilters(
            @Param("userId")     Long userId,
            @Param("fromDate")   LocalDateTime fromDate,
            @Param("toDate")     LocalDateTime toDate,
            @Param("result")     AuditResult result,
            @Param("actionType") AuditActionType actionType,
            Pageable pageable);


    @Query("""
            SELECT COUNT(a) FROM AuditLog a
            WHERE a.userId = :userId
              AND a.actionType = 'LOGIN_FAILED'
              AND a.createdAt >= :since
            """)
    long countFailedLoginsAfter(@Param("userId") Long userId,
                                @Param("since")  LocalDateTime since);

    @Query("""
            SELECT COUNT(a) FROM AuditLog a
            WHERE a.ipAddress = :ipAddress
              AND a.actionType = 'LOGIN_FAILED'
              AND a.createdAt >= :since
            """)
    long countFailedLoginsByIpAfter(@Param("ipAddress") String ipAddress,
                                    @Param("since")     LocalDateTime since);
}