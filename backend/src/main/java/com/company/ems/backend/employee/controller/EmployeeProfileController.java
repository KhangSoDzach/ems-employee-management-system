package com.company.ems.backend.employee.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeProfileResponse;
import com.company.ems.backend.employee.service.EmployeeProfileService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileService profileService;

    @GetMapping("/api/v1/profile")
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.success(profileService.getMyProfile()));
    }
    @GetMapping("/api/v1/employees/{employeeId}/profile")
    @PreAuthorize("""
            hasAuthority('EMPLOYEE_VIEW')
            and @dataScopeService.canAccessEmployee(#employeeId)
            """)
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> getEmployeeProfile(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getProfileById(employeeId)));
    }

    @GetMapping("/api/v1/employees/profiles")
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeProfileResponse>>> listProfiles(
            @RequestParam(defaultValue = "0")  int    page,
            @RequestParam(defaultValue = "10") int    size,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    String status) {
        return ResponseEntity.ok(
                ApiResponse.success(profileService.listProfiles(page, size, search, status)));
    }
}