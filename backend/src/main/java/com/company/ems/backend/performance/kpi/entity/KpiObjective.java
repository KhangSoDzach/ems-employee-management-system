package com.company.ems.backend.performance.kpi.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.MetricType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Entity
@Table(name = "kpi_objectives", indexes = {
        @Index(name = "idx_kpi_scope",      columnList = "scope_type, scope_id"),
        @Index(name = "idx_kpi_period",     columnList = "period_start, period_end"),
        @Index(name = "idx_kpi_type",       columnList = "type"),
        @Index(name = "idx_kpi_status",     columnList = "status"),
        @Index(name = "idx_kpi_is_deleted", columnList = "is_deleted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiObjective extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private KpiType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 10)
    private MetricType metricType;

    @Column(name = "target_value", nullable = false, precision = 20, scale = 2)
    private BigDecimal targetValue;

    @Column(name = "actual_value", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal actualValue = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope_type", nullable = false, length = 15)
    private ScopeType scopeType;

    @Column(name = "scope_id")
    private Long scopeId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private KpiStatus status = KpiStatus.INCOMPLETE;

    public BigDecimal calculateProgress() {
        if (targetValue == null || targetValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal raw = actualValue
                .divide(targetValue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        return raw.compareTo(BigDecimal.valueOf(100)) > 0
                ? BigDecimal.valueOf(100)
                : raw;
    }
}