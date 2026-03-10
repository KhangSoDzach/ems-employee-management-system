package com.company.ems.backend.asset.incident.controller;

import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import com.company.ems.backend.asset.incident.service.IncidentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Admin / HR APIs — Quản lý báo cáo sự cố tài sản
 *
 * GET  /api/v1/admin/asset-reports              → Tất cả báo cáo (có filter)
 * GET  /api/v1/admin/asset-reports/{id}         → Chi tiết
 * POST /api/v1/admin/asset-reports/{id}/approve → Phê duyệt
 * POST /api/v1/admin/asset-reports/{id}/reject  → Từ chối
 */
@RestController
@RequestMapping("/api/v1/admin/asset-reports")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ASSET_MANAGE')")
@Tag(name = "Asset Incident Reports (Admin/HR)", description = "Quản lý báo cáo sự cố tài sản")
public class AdminIncidentController {

    private final IncidentService incidentService;
    @GetMapping
    @Operation(summary = "Danh sách tất cả báo cáo sự cố")
    public ResponseEntity<ApiResponse<PageResponse<IncidentDto.AdminListItem>>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getAllReports(
                        status, employeeId, fromDate, toDate, keyword, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết báo cáo sự cố")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getReportDetail(id)));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt báo cáo — cập nhật condition tài sản thành DAMAGED")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) IncidentDto.ProcessRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                incidentService.approveReport(id, request, principal));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối báo cáo")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) IncidentDto.ProcessRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                incidentService.rejectReport(id, request, principal));
    }
}
