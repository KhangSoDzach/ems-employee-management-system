package com.company.ems.backend.performance.kpi.dto;

import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.MetricType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class KpiObjectiveDto {

    private KpiObjectiveDto() {}

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank(message = "{kpi.name.required}")
        @Size(max = 255, message = "{kpi.name.max_length}")
        private String name;

        @NotNull(message = "{kpi.type.required}")
        private KpiType type;

        @NotNull(message = "{kpi.metric_type.required}")
        private MetricType metricType;

        @NotNull(message = "{kpi.target_value.required}")
        @DecimalMin(value = "0.01", message = "{kpi.target_value.min}")
        private BigDecimal targetValue;

        @NotNull(message = "{kpi.weight.required}")
        @DecimalMin(value = "0.01", message = "{kpi.weight.min}")
        @DecimalMax(value = "100.00", message = "{kpi.weight.max}")
        private BigDecimal weight;

        private String description;

        @NotNull(message = "{kpi.scope_type.required}")
        private ScopeType scopeType;

        private Long scopeId;

        @NotNull(message = "{kpi.period_start.required}")
        private LocalDate periodStart;

        @NotNull(message = "{kpi.period_end.required}")
        private LocalDate periodEnd;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {

        @Size(max = 255, message = "{kpi.name.max_length}")
        private String name;

        private MetricType metricType;

        @DecimalMin(value = "0.01", message = "{kpi.target_value.min}")
        private BigDecimal targetValue;

        /** Updated actual achievement value */
        @DecimalMin(value = "0.00", message = "{kpi.actual_value.min}")
        private BigDecimal actualValue;

        @DecimalMin(value = "0.01", message = "{kpi.weight.min}")
        @DecimalMax(value = "100.00", message = "{kpi.weight.max}")
        private BigDecimal weight;

        private String description;

        private LocalDate periodStart;
        private LocalDate periodEnd;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        private Long        id;
        private String      name;
        private KpiType     type;
        private MetricType  metricType;
        private BigDecimal  targetValue;
        private BigDecimal  actualValue;
        private BigDecimal  progress;
        private BigDecimal  weight;
        private String      description;
        private ScopeType   scopeType;
        private Long        scopeId;
        private LocalDate   periodStart;
        private LocalDate   periodEnd;
        private KpiStatus   status;
        private String      createdBy;
        private String      createdAt;
        private String      updatedAt;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Summary {
        private Long        id;
        private String      name;
        private String      typeBadge;
        private MetricType  metricType;
        private BigDecimal  targetValue;
        private BigDecimal  actualValue;
        private BigDecimal  progress;
        private BigDecimal  weight;
        private KpiStatus   status;
    }

    @Data
    @Builder
    public static class ScopeHeader {
        private BigDecimal  totalWeight;
        private int         totalObjectives;
        private long        remainingDays;
        private KpiStatus   activationStatus;
    }
}