package com.company.ems.backend.payroll.domain.event;
import java.time.Instant;

public record PayrollExportedEvent(
        String  period,
        String  exportedByUserId,
        Instant occurredAt
) {}
