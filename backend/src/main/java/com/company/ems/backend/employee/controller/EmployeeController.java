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
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.service.EmployeeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;
    private final MessageService messages;
    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_CREATED), employeeService.createEmployee(request)));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), employeeService.getAllEmployees(page, size, department, position, status, search)));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PublicEmployeeResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), employeeService.getMyProfile()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW') and @empSec.canAccessEmployee(authentication, #id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(@PathVariable Long id) {
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), employeeService.getEmployeeById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE') and @empSec.canAccessEmployee(authentication, #id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        // TODO: Implement service layer
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_UPDATED), response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        // TODO: Implement service layer
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_DELETED), null));
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE') and @empSec.canAccessEmployee(authentication, #id)")
    public ResponseEntity<ApiResponse<String>> uploadEmployeeFiles(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String fileType) {
        // TODO: Implement file upload service
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_FILE_UPLOADED), null));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EMPLOYEE_IMPORT')")
    public ResponseEntity<ApiResponse<String>> importEmployees(
            @RequestParam("file") MultipartFile file) {
        // TODO: Implement import service
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_IMPORTED), null));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('EMPLOYEE_EXPORT')")
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