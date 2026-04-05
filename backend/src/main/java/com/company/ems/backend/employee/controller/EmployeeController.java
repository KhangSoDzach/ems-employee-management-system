package com.company.ems.backend.employee.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.EmployeeAttachmentResponse;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.dto.OfficialContractRequest;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.service.EmployeeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employee Management", description = "APIs for managing employee information")
public class EmployeeController {
    private final EmployeeService employeeService;
    private final MessageService messages;

    @PostMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_CREATE)
    @Operation(summary = "Create a new employee", description = "Creates a new employee record and returns the basic employee details")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_CREATED),
                        employeeService.createEmployee(request)));
    }

    @GetMapping
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_VIEW)
    @Operation(summary = "Get all employees", description = "Retrieves a paginated list of employees with optional filtering (subject to user's DataScope). Set includeDeleted=true to view archived employees.")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> getAllEmployees(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Department ID filter") @RequestParam(required = false) String department,
            @Parameter(description = "Position ID filter") @RequestParam(required = false) String position,
            @Parameter(description = "Status filter") @RequestParam(required = false) String status,
            @Parameter(description = "Search keyword (name/email)") @RequestParam(required = false) String search,
            @Parameter(description = "Include soft-deleted (archived) employees") @RequestParam(defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS),
                employeeService.getAllEmployees(page, size, department, position, status, search, includeDeleted)));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my profile", description = "Retrieves the read-only public profile of the currently authenticated employee, including annual leave remaining and attendance percentage")
    public ResponseEntity<ApiResponse<PublicEmployeeResponse>> getMyProfile() {
        return ResponseEntity
                .ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), employeeService.getMyProfile()));
    }

    @GetMapping("/team")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Get team members",
        description = "Returns a paginated, searchable list of team members for the current user. " +
                      "Employees (SELF) see members in the same manager group; Managers see direct reports; HR/Admin see all employees. " +
                      "Response is a slim projection — no sensitive fields (salary, bank, tax)."
    )
    public ResponseEntity<ApiResponse<PageResponse<MemberResponse>>> getTeamMembers(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Search keyword (name/email)") @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.COMMON_SUCCESS),
                employeeService.getTeamMembers(page, size, search)));
    }

    @GetMapping("/managers")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_VIEW)
    @Operation(summary = "Get managers list", description = "Returns employees with manager-level positions (level >= 3) for use in reporting manager dropdown")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.success("Success", employeeService.getManagers()));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_VIEW)
    @Operation(summary = "Get employee by ID", description = "Retrieves complete employee details by ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity
                .ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), employeeService.getEmployeeById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_UPDATE)
    @Operation(summary = "Update employee", description = "Updates an existing employee's details")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse response = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_UPDATED), response));
    }

    @PatchMapping("/{id}/official-contract")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_UPDATE)
    @Operation(summary = "Convert probation employee to official", description = "Confirms employee from PROBATION to ACTIVE, updates official salary and official contract info")
    public ResponseEntity<ApiResponse<EmployeeResponse>> convertToOfficial(
            @PathVariable Long id,
            @Valid @RequestBody OfficialContractRequest request) {
        EmployeeResponse response = employeeService.convertToOfficial(id, request);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_DELETE)
    @Operation(summary = "Delete employee", description = "Soft-deletes an employee: marks isDeleted=true, sets status to TERMINATED. The record is preserved for audit/history purposes but excluded from all list queries.")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_DELETED), null));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_UPDATE)
    @Operation(summary = "Restore employee", description = "Restores a soft-deleted employee: marks isDeleted=false, sets status to ACTIVE.")
    public ResponseEntity<ApiResponse<Void>> restoreEmployee(@PathVariable Long id) {
        employeeService.restoreEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Nhân viên đã được khôi phục thành công", null));
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE')")
    public ResponseEntity<ApiResponse<String>> uploadEmployeeFiles(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String fileType) {
        String fileUrl = employeeService.uploadEmployeeFile(id, file, fileType);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_FILE_UPLOADED), fileUrl));
    }

    @GetMapping("/{id}/files")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_VIEW)
    @Operation(summary = "Get employee attachments", description = "Returns list of uploaded document attachments for an employee")
    public ResponseEntity<ApiResponse<java.util.List<EmployeeAttachmentResponse>>> getEmployeeFiles(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.COMMON_SUCCESS),
                employeeService.getEmployeeAttachments(id)));
    }

    @GetMapping("/me/files")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my attachments", description = "Returns uploaded document attachments for currently authenticated employee")
    public ResponseEntity<ApiResponse<java.util.List<EmployeeAttachmentResponse>>> getMyEmployeeFiles() {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.COMMON_SUCCESS),
                employeeService.getMyEmployeeAttachments()));
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_UPDATE)
    @Operation(summary = "Delete employee attachment", description = "Soft-deletes an attachment and removes file from storage")
    public ResponseEntity<ApiResponse<Void>> deleteEmployeeFile(
            @PathVariable Long id,
            @PathVariable Long fileId) {
        employeeService.deleteEmployeeAttachment(id, fileId);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.COMMON_SUCCESS), null));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_IMPORT)
    public ResponseEntity<ApiResponse<String>> importEmployees(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.EMPLOYEE_IMPORTED), null));
    }

    @GetMapping("/export")
    @PreAuthorize(RoleAuthorization.HAS_PERM_EMPLOYEE_EXPORT)
    public ResponseEntity<byte[]> exportEmployees(
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String position) {
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=employees." + format)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new byte[0]);
    }
}