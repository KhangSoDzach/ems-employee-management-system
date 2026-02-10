package com.company.ems.backend.employee.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    /**
     * Create a new employee
     * POST /api/v1/employees
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody EmployeeRequest request) {
        // TODO: Implement service layer
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", null));
    }

    /**
     * Get all employees with pagination and filtering
     * GET /api/v1/employees
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get employee by ID
     * GET /api/v1/employees/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(@PathVariable Long id) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Update employee
     * PUT /api/v1/employees/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", null));
    }

    /**
     * Delete employee
     * DELETE /api/v1/employees/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully", null));
    }

    /**
     * Upload files for employee (documents, avatar, etc.)
     * POST /api/v1/employees/{id}/files
     */
    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
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
