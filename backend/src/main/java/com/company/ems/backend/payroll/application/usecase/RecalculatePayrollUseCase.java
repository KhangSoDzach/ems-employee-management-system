package com.company.ems.backend.payroll.application.usecase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
@Slf4j
public class RecalculatePayrollUseCase {

    private final RunPayrollUseCase runPayrollUseCase;

    @Transactional
    public RunPayrollResult execute(RunPayrollCommand cmd) {
        log.info("[Payroll] Recalculate triggered — period={} by={}",
                cmd.period(), cmd.requestedBy());
        RunPayrollResult result = runPayrollUseCase.execute(cmd);

        log.info("[Payroll] Recalculate complete — period={} processed={} skipped={}",
                result.period(), result.processedEmployees(), result.skippedEmployees());

        return result;
    }
}
