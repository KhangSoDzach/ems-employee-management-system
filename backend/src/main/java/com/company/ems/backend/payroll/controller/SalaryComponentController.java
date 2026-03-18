package com.company.ems.backend.payroll.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.common.constant.AppRole;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;
import com.company.ems.backend.payroll.service.SalaryComponentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payroll/components")
@RequiredArgsConstructor
@Tag(name = "Payroll Configuration", description = "APIs for managing salary components")
@SecurityRequirement(name = "bearerAuth")
public class SalaryComponentController {

    private final SalaryComponentService salaryComponentService;
    private final MessageService messages;

    @GetMapping
    @PreAuthorize(AppRole.HAS_ADMIN_ONLY)
    @Operation(summary = "List salary components")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Salary components retrieved")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
    public ResponseEntity<ApiResponse<List<SalaryComponentResponse>>> listComponents() {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.SALARY_COMPONENT_LIST),
                salaryComponentService.listComponents()));
    }

    @PostMapping
    @PreAuthorize(AppRole.HAS_ADMIN_ONLY)
    @Operation(summary = "Create salary component")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Salary component created")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate salary component code or name")
    public ResponseEntity<ApiResponse<SalaryComponentResponse>> createComponent(
            @Valid @RequestBody SalaryComponentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        messages.get(MessageCode.SALARY_COMPONENT_CREATED),
                        salaryComponentService.createComponent(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppRole.HAS_ADMIN_ONLY)
    @Operation(summary = "Update salary component")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Salary component updated")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Salary component not found")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate salary component code or name")
    public ResponseEntity<ApiResponse<SalaryComponentResponse>> updateComponent(
            @PathVariable Long id,
            @Valid @RequestBody SalaryComponentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.SALARY_COMPONENT_UPDATED),
                salaryComponentService.updateComponent(id, request)));
    }
}
