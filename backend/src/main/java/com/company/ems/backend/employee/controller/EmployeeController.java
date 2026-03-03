package com.company.ems.backend.employee.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.service.EmployeeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@Tag(name = "Employees", description = "Quản lý hồ sơ nhân viên")
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;
    /**
     * Create a new employee
     * POST /api/v1/employees
     */
    @PostMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_CREATE')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", response));
    }

    /**
     * Get own profile (read-only) – any authenticated user
     * GET /api/v1/employees/me
     */
    @Operation(
        summary = "Xem hồ sơ của tôi (read-only)",
        description = """
            Trả thông tin hồ sơ (không có trường nhạy cảm: lương, CCCD, ngân hàng) của user đang đăng nhập.
            - Mọi role đều có thể gọi.
            - Chỉ trả dữ liệu read-only; không có endpoint tự cập nhật bằng role EMPLOYEE.
            - Để cập nhật hồ sơ nhân viên, cần role HR hoặc ADMIN.""",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PublicEmployeeResponse>> getMyProfile() {
        PublicEmployeeResponse response = employeeService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get all employees with pagination and filtering
     * GET /api/v1/employees
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<PublicEmployeeResponse>>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        PageResponse<EmployeeResponse> response = employeeService.getAllEmplyees(page, size, department, position, status, search);
        // Map to public response to avoid exposing sensitive fields
        PageResponse<PublicEmployeeResponse> publicPage = PageResponse.<PublicEmployeeResponse>builder()
                .content(response.getContent().stream().map(this::toPublic).toList())
                .page(response.getPage())
                .size(response.getSize())
                .totalElements(response.getTotalElements())
                .totalPages(response.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(publicPage));
    }

    /**
     * Get employee by ID
     * GET /api/v1/employees/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<PublicEmployeeResponse>> getEmployeeById(@PathVariable Long id) {
        EmployeeResponse response = employeeService.getEmployeeById(id);
        PublicEmployeeResponse publicResp = toPublic(response);
        return ResponseEntity.ok(ApiResponse.success(publicResp));
    }

    // Map internal/full EmployeeResponse to public DTO (exclude sensitive fields)
    private PublicEmployeeResponse toPublic(EmployeeResponse r) {
        if (r == null) return null;
        return PublicEmployeeResponse.builder()
                .id(r.getId())
                .firstName(r.getFirstName())
                .lastName(r.getLastName())
                .email(r.getEmail())
                .phone(r.getPhone())
                .dateOfBirth(r.getDateOfBirth())
                .hireDate(r.getHireDate())
                .position(r.getPosition())
                .department(r.getDepartment())
                .address(r.getAddress())
                .city(r.getCity())
                .state(r.getState())
                .country(r.getCountry())
                .status(r.getStatus())
                // avatarUrl: EmployeeResponse chưa expose trường này; ServiceImpl.mapToPublicResponse dùng trực tiếp
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    /**
     * Update employee – chỉ HR / Admin mới có quyền EMPLOYEE_UPDATE (US-07 AC-04).
     * ROLE_EMPLOYEE và ROLE_MANAGER không được phép gọi endpoint này.
     * PUT /api/v1/employees/{id}
     */
    @Operation(
        summary = "Cập nhật hồ sơ nhân viên (HR / Admin only)",
        description = "Chỉ tài khoản có role HR hoặc ADMIN (permission EMPLOYEE_UPDATE) mới được phép cập nhật.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_UPDATE')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully",response));
    }

    /**
     * Delete employee
     * DELETE /api/v1/employees/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        // TODO: Implement service layer
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully", null));
    }

    /**
     * Upload files for employee (documents, avatar, etc.)
     * POST /api/v1/employees/{id}/files
     */
    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_UPDATE')")
    public ResponseEntity<ApiResponse<String>> uploadEmployeeFiles(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String fileType) {
        // TODO: Implement file upload service
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", null));
    }

    /**
     * Import employees from CSV/Excel file
     * POST /api/v1/employees/import
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_IMPORT')")
    public ResponseEntity<ApiResponse<String>> importEmployees(
            @RequestParam("file") MultipartFile file) {
        // TODO: Implement import service
        return ResponseEntity.ok(ApiResponse.success("Employees imported successfully", null));
    }

    /**
     * Export employees to CSV/Excel
     * GET /api/v1/employees/export
     */
    @GetMapping("/export")
    @PreAuthorize("hasPermission(null, 'EMPLOYEE_EXPORT')")
    public ResponseEntity<byte[]> exportEmployees(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position) {
        // TODO: Implement export service
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=employees." + format)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new byte[0]);
    }
}
