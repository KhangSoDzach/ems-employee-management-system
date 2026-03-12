package com.company.ems.backend.performance.kpi.controller;

import com.company.ems.backend.common.constant.AppRole;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.performance.kpi.dto.KpiObjectiveDto;
import com.company.ems.backend.performance.kpi.enums.KpiStatus;
import com.company.ems.backend.performance.kpi.enums.KpiType;
import com.company.ems.backend.performance.kpi.enums.ScopeType;
import com.company.ems.backend.performance.kpi.service.KpiObjectiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/kpi-objectives")
@RequiredArgsConstructor
public class KpiObjectiveController {

    private final KpiObjectiveService kpiService;
    private final MessageService      messages;

    @PostMapping
    @PreAuthorize(AppRole.HAS_MANAGER_OR_ABOVE)
    public ResponseEntity<ApiResponse<KpiObjectiveDto.Response>> createObjective(
            @Valid @RequestBody KpiObjectiveDto.CreateRequest request) {

        KpiObjectiveDto.Response created = kpiService.createObjective(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.KPI_CREATED), created));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppRole.HAS_MANAGER_OR_ABOVE)
    public ResponseEntity<ApiResponse<KpiObjectiveDto.Response>> updateObjective(
            @PathVariable Long id,
            @Valid @RequestBody KpiObjectiveDto.UpdateRequest request) {

        KpiObjectiveDto.Response updated = kpiService.updateObjective(id, request);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.KPI_UPDATED), updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppRole.HAS_MANAGER_OR_ABOVE)
    public ResponseEntity<ApiResponse<Void>> deleteObjective(@PathVariable Long id) {
        kpiService.deleteObjective(id);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.KPI_DELETED), null));
    }

    @GetMapping("/{id}")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<KpiObjectiveDto.Response>> getObjective(
            @PathVariable Long id) {

        return ResponseEntity.ok(ApiResponse.success(kpiService.getObjective(id)));
    }

    @GetMapping
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PageResponse<KpiObjectiveDto.Summary>>> listObjectives(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ScopeType scopeType,
            @RequestParam(required = false) Long      scopeId,
            @RequestParam(required = false) KpiType   type,
            @RequestParam(required = false) KpiStatus status,
            @RequestParam(required = false) String    keyword) {

        return ResponseEntity.ok(ApiResponse.success(
                kpiService.listObjectives(page, size, scopeType, scopeId, type, status, keyword)));
    }

    @GetMapping("/summary")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<KpiObjectiveDto.ScopeHeader>> getSummary(
            @RequestParam(required = false) ScopeType scopeType,
            @RequestParam(required = false) Long      scopeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd) {

        KpiObjectiveDto.ScopeHeader header =
                kpiService.getSummary(scopeType, scopeId, periodStart, periodEnd);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.KPI_SUMMARY), header));
    }
}