package com.company.ems.backend.asset.incident.controller;

import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.service.IncidentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "My Assets (Employee)", description = "Tài sản và báo cáo sự cố của nhân viên")
public class MyAssetController {

    private final IncidentService incidentService;
    @GetMapping("/my/assets")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    @Operation(summary = "Danh sách tài sản được cấp phát cho tôi")
    public ResponseEntity<ApiResponse<PageResponse<IncidentDto.MyAsset>>> getMyAssets(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getMyAssets(principal)));
    }

    @PostMapping(value = "/assets/{assetId}/report",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    @Operation(summary = "Gửi báo cáo sự cố tài sản")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> submitReport(
            @PathVariable Long assetId,
            @Valid @RequestPart("data") IncidentDto.SubmitRequest request,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        return ResponseEntity.ok(
                incidentService.submitReport(assetId, request, attachment, principal));
    }

    @GetMapping("/my/reports")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    @Operation(summary = "Lịch sử báo cáo sự cố của tôi")
    public ResponseEntity<ApiResponse<PageResponse<IncidentDto.ReportRow>>> getMyReports(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getMyReports(page, size, principal)));
    }

    @GetMapping("/my/reports/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    @Operation(summary = "Chi tiết báo cáo sự cố của tôi")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> getMyReportDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getMyReportDetail(id, principal)));
    }
}