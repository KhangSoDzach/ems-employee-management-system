package com.company.ems.backend.auth.controller;

import com.company.ems.backend.auth.dto.UpdateRoleRequest;
import com.company.ems.backend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    /**
     * Update user role
     * PUT /api/v1/users/{id}/roles
     */
    @PutMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        // TODO: Implement role update service
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", null));
    }
}
