package com.company.ems.backend.performance.kpi.mapper;

import com.company.ems.backend.performance.kpi.dto.KpiObjectiveDto;
import com.company.ems.backend.performance.kpi.entity.KpiObjective;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class KpiObjectiveMapper {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public KpiObjectiveDto.Response toResponse(KpiObjective k) {
        return KpiObjectiveDto.Response.builder()
                .id(k.getId())
                .name(k.getName())
                .type(k.getType())
                .metricType(k.getMetricType())
                .targetValue(k.getTargetValue())
                .actualValue(k.getActualValue())
                .progress(k.calculateProgress())
                .weight(k.getWeight())
                .description(k.getDescription())
                .scopeType(k.getScopeType())
                .scopeId(k.getScopeId())
                .periodStart(k.getPeriodStart())
                .periodEnd(k.getPeriodEnd())
                .status(k.getStatus())
                .createdBy(k.getCreatedBy())
                .createdAt(k.getCreatedAt() != null ? k.getCreatedAt().format(DT_FMT) : null)
                .updatedAt(k.getUpdatedAt() != null ? k.getUpdatedAt().format(DT_FMT) : null)
                .build();
    }

    public KpiObjectiveDto.Summary toSummary(KpiObjective k) {
        return KpiObjectiveDto.Summary.builder()
                .id(k.getId())
                .name(k.getName())
                .typeBadge(k.getType().name())
                .metricType(k.getMetricType())
                .targetValue(k.getTargetValue())
                .actualValue(k.getActualValue())
                .progress(k.calculateProgress())
                .weight(k.getWeight())
                .status(k.getStatus())
                .build();
    }
}