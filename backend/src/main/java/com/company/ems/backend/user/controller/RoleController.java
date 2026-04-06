package com.company.ems.backend.user.controller;

import java.util.List;

import com.company.ems.backend.common.constant.RoleAuthorization;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.user.dto.RoleOptionResponse;
import com.company.ems.backend.user.repository.RoleRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Role Management", description = "APIs for role lookup")
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Get active roles", description = "Returns all non-deleted roles for dropdown selections")
    public ResponseEntity<ApiResponse<List<RoleOptionResponse>>> getAllRoles() {
        List<RoleOptionResponse> roles = roleRepository.findAllByIsDeletedFalse().stream()
                .map(role -> RoleOptionResponse.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .description(role.getDescription())
                        .build())
            .toList();

        return ResponseEntity.ok(ApiResponse.success("Success", roles));
    }
}
