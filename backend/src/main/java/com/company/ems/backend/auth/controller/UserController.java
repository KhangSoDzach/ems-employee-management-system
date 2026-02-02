package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.dto.UpdateRoleRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User Management", description = "APIs for managing user roles and permissions")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Operation(summary = "Update user role", description = "Update role and permissions for a specific user")
    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        // TODO: Implement role update service
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", null));
    }
}
