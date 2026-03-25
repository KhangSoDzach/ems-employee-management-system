package com.company.ems.backend.payroll.controller;

import com.company.ems.backend.common.constant.RoleAuthorization;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.payroll.application.usecase.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
@Validated
@Tag(name = "Payroll", description = "Payroll processing and access APIs")
@SecurityRequirement(name = "bearerAuth")
public class PayrollController {

    private final RunPayrollUseCase runPayrollUseCase;
    private final RecalculatePayrollUseCase  recalculatePayrollUseCase;
    private final GetMyPayrollHistoryUseCase getMyPayrollHistoryUseCase;
    private final GetPayrollByPeriodUseCase  getPayrollByPeriodUseCase;
    private final ExportPayrollCsvUseCase    exportPayrollCsvUseCase;

    public record RunPayrollRequest(
            @NotBlank(message = "Period must not be blank")
            @Pattern(regexp = "\\d{4}-\\d{2}",
                    message = "Period must be in yyyy-MM format (e.g. 2026-03)")
            String period
    ) {}

    @GetMapping("/my-history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get my payroll history",
            description = "Identity from JWT only — no employeeId parameter accepted.")
    public ResponseEntity<ApiResponse<List<GetMyPayrollHistoryUseCase.PayrollSlipDto>>>
    getMyHistory() {
        return ResponseEntity.ok(
                ApiResponse.success("Lịch sử lương", getMyPayrollHistoryUseCase.execute()));
    }

    @GetMapping("/period/{period}")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Get payroll by period (HR/ADMIN)",
            description = "All employees for the period. N+1-safe JOIN FETCH. Format: yyyy-MM")
    public ResponseEntity<ApiResponse<GetPayrollByPeriodUseCase.PeriodPayrollResult>>
    getByPeriod(
            @PathVariable
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "Period must be yyyy-MM")
            String period) {
        return ResponseEntity.ok(
                ApiResponse.success("Bảng lương kỳ " + period,
                        getPayrollByPeriodUseCase.execute(period)));
    }

    @GetMapping("/period/{period}/export")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Export payroll CSV (HR/ADMIN)",
            description = "UTF-8 CSV with BOM. Streaming — safe for large datasets.")
    public void exportCsv(
            @PathVariable
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "Period must be yyyy-MM")
            String period,
            HttpServletResponse response,
            Authentication auth) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"bang-luong-" + period + ".csv\"");
        response.setCharacterEncoding("UTF-8");

        exportPayrollCsvUseCase.execute(period, response.getOutputStream());
    }

    @PostMapping("/run")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Run payroll for a period")
    public ResponseEntity<ApiResponse<RunPayrollResult>> runPayroll(
            @Valid @RequestBody RunPayrollRequest request,
            Authentication auth) {
        RunPayrollCommand cmd = new RunPayrollCommand(request.period(), auth.getName());
        return ResponseEntity.ok(
                ApiResponse.success("Tính lương thành công", runPayrollUseCase.execute(cmd)));
    }

    @PostMapping("/recalculate/{period}")
    @PreAuthorize(RoleAuthorization.HAS_HR_OR_ADMIN)
    @Operation(summary = "Recalculate payroll for existing period (AC-03)")
    public ResponseEntity<ApiResponse<RunPayrollResult>> recalculatePayroll(
            @PathVariable
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "Period must be yyyy-MM")
            String period,
            Authentication auth) {
        RunPayrollCommand cmd = new RunPayrollCommand(period, auth.getName());
        return ResponseEntity.ok(
                ApiResponse.success("Tính lại lương thành công",
                        recalculatePayrollUseCase.execute(cmd)));
    }
}
