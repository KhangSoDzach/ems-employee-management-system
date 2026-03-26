package com.company.ems.backend.payroll.application.usecase;

import java.math.BigDecimal;

public record RunPayrollResult(
        String     period,
        int        processedEmployees,
        int        skippedEmployees,
        BigDecimal totalPayroll,
        String     status
) {
    public static RunPayrollResult success(
            String period, int processed, int skipped, BigDecimal total) {
        return new RunPayrollResult(period, processed, skipped, total, "SUCCESS");
    }
}
