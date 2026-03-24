package com.company.ems.backend.asset.incident.controller;

import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.service.IncidentService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.constant.RoleAuthorization;
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

import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.service.AssetRequestService;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "My Assets (Employee)")
public class MyAssetController {

    private final IncidentService incidentService;
    private final AssetRequestService requestService;

    @GetMapping("/my/assets")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get assets assigned to me")
    public ResponseEntity<ApiResponse<PageResponse<IncidentDto.MyAsset>>> getMyAssets(
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getMyAssets(principal)));
    }

    @PostMapping(value = "/assets/{assetId}/report",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Submit an asset incident report")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> submitReport(
            @PathVariable Long assetId,
            @Valid @RequestPart("data") IncidentDto.SubmitRequest request,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                incidentService.submitReport(assetId, request, attachment, principal));
    }

    @GetMapping("/my/reports")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get my incident report history")
    public ResponseEntity<ApiResponse<PageResponse<IncidentDto.ReportRow>>> getMyReports(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getMyReports(page, size, principal)));
    }

    @GetMapping("/my/reports/{id}")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get detail of my incident report")
    public ResponseEntity<ApiResponse<IncidentDto.ReportDetail>> getMyReportDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                ApiResponse.success(incidentService.getMyReportDetail(id, principal)));
    }

    @PostMapping("/my/asset-requests")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Submit a request for a new asset")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> submitAssetRequest(
            @Valid @RequestBody AssetRequestDto.SubmitRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(requestService.submitRequest(request, principal));
    }

    @PostMapping("/my/asset-requests/{id}/cancel")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Cancel a pending asset request")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> cancelAssetRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(requestService.cancelRequest(id, principal));
    }

    @GetMapping("/my/asset-requests")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get my asset requests history")
    public ResponseEntity<ApiResponse<PageResponse<AssetRequestDto.RequestRow>>> getMyAssetRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                ApiResponse.success(requestService.getMyRequests(page, size, principal)));
    }

    @GetMapping("/my/asset-requests/{id}")
    @PreAuthorize(RoleAuthorization.HAS_ANY)
    @Operation(summary = "Get detail of my asset request")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> getMyAssetRequestDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(
                ApiResponse.success(requestService.getMyRequestDetail(id, principal)));
    }
}
