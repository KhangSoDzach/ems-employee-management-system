package com.company.ems.backend.performance.kpi.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.performance.kpi.dto.KpiObjectiveDto;
import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;

public interface KpiObjectiveService {
    KpiObjectiveDto.Response createObjective(KpiObjectiveDto.CreateRequest req);

    KpiObjectiveDto.Response updateObjective(Long id, KpiObjectiveDto.UpdateRequest req);

    void deleteObjective(Long id);

    KpiObjectiveDto.Response getObjective(Long id);

    PageResponse<KpiObjectiveDto.Summary> listObjectives(
            int page, int size,
            ScopeType scopeType, Long scopeId,
            KpiType type, KpiStatus status,
            String keyword);

    KpiObjectiveDto.ScopeHeader getSummary(
            ScopeType scopeType, Long scopeId,
            java.time.LocalDate periodStart, java.time.LocalDate periodEnd);
}