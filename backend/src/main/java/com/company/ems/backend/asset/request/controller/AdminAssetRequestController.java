package com.company.ems.backend.asset.request.controller;

import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.enums.AssetRequestStatus;
import com.company.ems.backend.asset.request.service.AssetRequestService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/asset-requests")
@RequiredArgsConstructor
@Tag(name = "Asset Requests (Admin/HR)")
public class AdminAssetRequestController {

    private final AssetRequestService requestService;

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Get all asset requests (with filters)")
    public ResponseEntity<ApiResponse<PageResponse<AssetRequestDto.AdminListItem>>> getAllRequests(
            @RequestParam(required = false) AssetRequestStatus status,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                requestService.getAllRequests(status, employeeId, fromDate, toDate, keyword, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Get asset request details")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> getRequestDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.getRequestDetail(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Approve an asset request")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) AssetRequestDto.ProcessRequest requestDto,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(requestService.approveRequest(id, requestDto, principal));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Reject an asset request")
    public ResponseEntity<ApiResponse<AssetRequestDto.RequestDetail>> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) AssetRequestDto.ProcessRequest requestDto,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ResponseEntity.ok(requestService.rejectRequest(id, requestDto, principal));
    }
}
