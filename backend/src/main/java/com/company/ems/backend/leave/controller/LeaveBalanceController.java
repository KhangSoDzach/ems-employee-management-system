package com.company.ems.backend.leave.controller;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.service.LeaveBalanceService;
import com.company.ems.backend.rbac.service.DataScopeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for retrieving employee leave balances.
 */
@RestController
@RequestMapping("/api/v1/leave-balances")
@RequiredArgsConstructor
@Tag(name = "Leave Balances", description = "Query leave balance quotas and usage")
public class LeaveBalanceController {

    private final LeaveBalanceService leaveBalanceService;
    private final EmployeeRepository employeeRepository;
    private final DataScopeService dataScopeService;

    /**
     * Get balances for the currently authenticated employee.
     */
    @GetMapping
    @PreAuthorize("hasPermission(null, 'LEAVE_BALANCE_READ')")
    @Operation(summary = "Get my leave balances for the current year")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> getMyBalances() {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();
        Employee employee = employeeRepository.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", principal.getUserId()));

        List<LeaveBalanceResponse> balances = leaveBalanceService.getBalanceForEmployee(employee.getId());
        return ResponseEntity.ok(ApiResponse.success("OK", balances));
    }

    /**
     * Get balances for a specific employee (Managers/HR/Admins).
     */
    @GetMapping("/{employeeId}")
    @PreAuthorize("hasPermission(null, 'LEAVE_BALANCE_READ')")
    @Operation(summary = "Get leave balances for a specific employee (requires data scope access)")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> getEmployeeBalances(
            @PathVariable Long employeeId) {
        CustomUserPrincipal principal = dataScopeService.getCurrentPrincipal();

        // Ideally, we'd add asserting access to the DataScopeService for balances,
        // but checking employee access is sufficient here since balance scope =
        // employee scope.
        // Assuming DataScopeService has an assertCanAccessEmployee method:
        // dataScopeService.assertCanAccessEmployee(principal, employeeId);

        // Security fallback if dataScope check is not available: Admin/HR all, Manager
        // team
        // Let's implement a quick permission check here
        Employee target = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        validateAccess(principal, target);

        List<LeaveBalanceResponse> balances = leaveBalanceService.getBalanceForEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.success("OK", balances));
    }

    private void validateAccess(CustomUserPrincipal principal, Employee targetEmployee) {
        // If checking own balance, allow
        if (targetEmployee.getUser() != null && targetEmployee.getUser().getId().equals(principal.getUserId())) {
            return;
        }

        // If user has 'ALL' data scope (Admin/HR), allow
        if (principal.hasDataScope(com.company.ems.backend.user.enums.DataScope.ALL)) {
            return;
        }

        // If user has 'TEAM' data scope (Manager), check if target is a subordinate
        if (principal.hasDataScope(com.company.ems.backend.user.enums.DataScope.TEAM)) {
            if (targetEmployee.getReportingManager() != null
                    && targetEmployee.getReportingManager().getUser() != null
                    && targetEmployee.getReportingManager().getUser().getId().equals(principal.getUserId())) {
                return;
            }
        }

        throw new ForbiddenException();
    }
}
