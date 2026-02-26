package com.company.ems.backend.employee.search.controller;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.search.dto.EmployeeListResponse;
import com.company.ems.backend.employee.search.dto.EmployeeSearchRequest;
import com.company.ems.backend.employee.search.service.EmployeeSearchService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/employees/search")
@RequiredArgsConstructor
@Validated
public class EmployeeSearchController {

    private final EmployeeSearchService searchService;

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeListResponse>>> search(
            @RequestParam(required = false)    String         keyword,
            @RequestParam(required = false)    String         department,
            @RequestParam(required = false)    EmployeeStatus status,
            @RequestParam(required = false)    String         sortBy,
            @RequestParam(defaultValue = "asc") String        sortDir,
            @RequestParam(defaultValue = "0")  @Min(0) int   page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {

        EmployeeSearchRequest request = EmployeeSearchRequest.builder()
                .keyword(keyword)
                .department(department)
                .status(status)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .page(page)
                .size(size)
                .build();

        return ResponseEntity.ok(ApiResponse.success(searchService.search(request)));
    }
}