package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.OfficeConfigRequest;
import com.company.ems.backend.attendance.dto.OfficeConfigResponse;
import com.company.ems.backend.attendance.service.OfficeConfigService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.rbac.service.DataScopeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Admin to manage office GPS location configuration.
 *
 * <p>
 * All endpoints require the {@code SYSTEM_CONFIG_MANAGE} permission (ROLE_ADMIN
 * only).
 *
 * <ul>
 * <li>{@code GET  /api/v1/admin/config/office-location} — read current
 * config</li>
 * <li>{@code PUT  /api/v1/admin/config/office-location} — manual coordinate
 * input</li>
 * <li>{@code POST /api/v1/admin/config/office-location/auto} — auto-capture
 * from admin's browser location</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/admin/config/office-location")
@RequiredArgsConstructor
@Tag(name = "Admin – System Config", description = "Runtime configuration of office GPS location for checkin validation")
@SecurityRequirement(name = "bearerAuth")
public class AdminOfficeConfigController {

    private final OfficeConfigService officeConfigService;
    private final DataScopeService dataScopeService;

    /**
     * GET /api/v1/admin/config/office-location
     *
     * <p>
     * Returns the currently active office location (DB override or YAML default).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_MANAGE')")
    @Operation(summary = "Get current office location config")
    public ResponseEntity<ApiResponse<OfficeConfigResponse>> getOfficeConfig() {
        OfficeConfigResponse config = officeConfigService.getOfficeConfig();
        return ResponseEntity.ok(ApiResponse.success("Cấu hình văn phòng hiện tại.", config));
    }

    /**
     * PUT /api/v1/admin/config/office-location
     *
     * <p>
     * Admin types in latitude, longitude, and radius manually.
     * All three fields are required for this endpoint.
     */
    @PutMapping
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_MANAGE')")
    @Operation(summary = "Set office location manually (enter coordinates)")
    public ResponseEntity<ApiResponse<OfficeConfigResponse>> updateManual(
            @Valid @RequestBody OfficeConfigRequest request) {

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        OfficeConfigResponse result = officeConfigService.updateManual(request, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật tọa độ văn phòng.", result));
    }

    /**
     * POST /api/v1/admin/config/office-location/auto
     *
     * <p>
     * Admin's browser captures its current GPS position and sends it as the
     * request body. The server saves those coordinates as the new office location.
     * {@code radiusMeters} is optional — the existing value is kept if not sent.
     */
    @PostMapping("/auto")
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG_MANAGE')")
    @Operation(summary = "Auto-set office location from admin's current position")
    public ResponseEntity<ApiResponse<OfficeConfigResponse>> updateAuto(
            @Valid @RequestBody OfficeConfigRequest request) {

        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        OfficeConfigResponse result = officeConfigService.updateAuto(request, principal.getUsername());
        return ResponseEntity
                .ok(ApiResponse.success("Đã tự động cập nhật vị trí văn phòng từ vị trí hiện tại.", result));
    }
}
