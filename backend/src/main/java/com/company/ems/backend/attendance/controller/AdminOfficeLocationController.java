package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.OfficeLocationRequest;
import com.company.ems.backend.attendance.dto.OfficeLocationResponse;
import com.company.ems.backend.attendance.service.OfficeLocationService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.constant.RoleAuthorization;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/office-locations")
@RequiredArgsConstructor
@Tag(name = "Admin – Office Locations", description = "Management of office branches and their GPS coordinates for check-in validation")
@SecurityRequirement(name = "bearerAuth")
public class AdminOfficeLocationController {

    private final OfficeLocationService officeLocationService;
    private final DataScopeService dataScopeService;

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Get all office locations")
    public ResponseEntity<ApiResponse<List<OfficeLocationResponse>>> getAllLocations() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách vị trí văn phòng.", officeLocationService.getAllLocations()));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Get office location by ID")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> getLocationById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Thông tin vị trí văn phòng.", officeLocationService.getLocationById(id)));
    }

    @PostMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Create new office location")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> createLocation(@Valid @RequestBody OfficeLocationRequest request) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Đã tạo vị trí văn phòng mới.", officeLocationService.createLocation(request, principal.getUsername())));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Update office location")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> updateLocation(@PathVariable Long id, @Valid @RequestBody OfficeLocationRequest request) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật vị trí văn phòng.", officeLocationService.updateLocation(id, request, principal.getUsername())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Delete office location")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        officeLocationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa vị trí văn phòng.", null));
    }
}
