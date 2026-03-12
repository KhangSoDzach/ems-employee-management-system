package com.company.ems.backend.performance.kpi.repository;

import com.company.ems.backend.performance.kpi.entity.KpiObjective;
import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface KpiObjectiveRepository extends JpaRepository<KpiObjective, Long> {

    @Query("SELECT k FROM KpiObjective k WHERE k.id = :id AND k.isDeleted = false")
    Optional<KpiObjective> findActiveById(@Param("id") Long id);

    @Query("""
            SELECT k FROM KpiObjective k
            WHERE k.isDeleted = false
              AND (:scopeType IS NULL OR k.scopeType = :scopeType)
              AND (:scopeId   IS NULL OR k.scopeId   = :scopeId)
              AND (:type      IS NULL OR k.type       = :type)
              AND (:status    IS NULL OR k.status     = :status)
              AND (:keyword   IS NULL OR :keyword = ''
                   OR LOWER(k.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY k.createdAt DESC
            """)
    Page<KpiObjective> findFiltered(
            @Param("scopeType") ScopeType scopeType,
            @Param("scopeId")   Long scopeId,
            @Param("type")      KpiType type,
            @Param("status")    KpiStatus status,
            @Param("keyword")   String keyword,
            Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(k.weight), 0)
            FROM KpiObjective k
            WHERE k.isDeleted = false
              AND k.scopeType    = :scopeType
              AND (:scopeId IS NULL OR k.scopeId = :scopeId)
              AND k.periodStart  = :periodStart
              AND k.periodEnd    = :periodEnd
            """)
    BigDecimal sumWeightByScope(
            @Param("scopeType")   ScopeType scopeType,
            @Param("scopeId")     Long scopeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd")   LocalDate periodEnd);

    @Query("""
            SELECT COALESCE(SUM(k.weight), 0)
            FROM KpiObjective k
            WHERE k.isDeleted = false
              AND k.id           <> :excludeId
              AND k.scopeType    = :scopeType
              AND (:scopeId IS NULL OR k.scopeId = :scopeId)
              AND k.periodStart  = :periodStart
              AND k.periodEnd    = :periodEnd
            """)
    BigDecimal sumWeightByScopeExcluding(
            @Param("excludeId")   Long excludeId,
            @Param("scopeType")   ScopeType scopeType,
            @Param("scopeId")     Long scopeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd")   LocalDate periodEnd);
}