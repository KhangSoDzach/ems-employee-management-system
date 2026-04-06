package com.company.ems.backend.attendance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.attendance.dto.PositionLocationMappingRequest;
import com.company.ems.backend.attendance.dto.PositionLocationMappingResponse;
import com.company.ems.backend.attendance.service.PositionLocationMappingService;
import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/office-locations/position-mappings")
@RequiredArgsConstructor
@Tag(name = "Admin – Position Location Mapping", description = "Assign office location for each position")
@SecurityRequirement(name = "bearerAuth")
public class AdminPositionLocationMappingController {

    private final PositionLocationMappingService positionLocationMappingService;

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Get all active positions and their office location mapping")
    public ResponseEntity<ApiResponse<List<PositionLocationMappingResponse>>> getAllMappings() {
        return ResponseEntity.ok(ApiResponse.success(
                "Danh sách mapping vị trí - văn phòng.",
                positionLocationMappingService.getAllMappings()));
    }

    @PutMapping("/{positionId}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_SYSTEM_CONFIG_MANAGE)
    @Operation(summary = "Assign office location for a position")
    public ResponseEntity<ApiResponse<PositionLocationMappingResponse>> updateMapping(
            @PathVariable Long positionId,
            @Valid @RequestBody PositionLocationMappingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã cập nhật mapping vị trí - văn phòng.",
                positionLocationMappingService.updateMapping(positionId, request)));
    }
}
