package com.company.ems.backend.payroll.domain.event;
import java.time.Instant;

public record PayrollRunEvent(
        String  period,
        int     processedEmployees,
        int     skippedEmployees,
        String  triggeredByUserId,
        Instant occurredAt
) {}
