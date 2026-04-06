package com.company.ems.backend.payroll.application.usecase;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.payroll.domain.event.PayrollExportedEvent;
import com.company.ems.backend.payroll.domain.policy.PayrollAccessPolicy;
import com.company.ems.backend.payroll.domain.valueobject.PayrollPeriod;
import com.company.ems.backend.payroll.infrastructure.csv.PayrollCsvExporter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.time.Instant;
import java.util.List;

/**
 * Use-case: Export payroll for a period as streaming CSV.
 *
 * <p>Authorization: {@link PayrollAccessPolicy#requireCanExport} — HR/ADMIN only.
 *
 * <p>Audit extension point: publishes {@link PayrollExportedEvent} on success
 * so an event listener can write audit logs when that feature is implemented.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExportPayrollCsvUseCase {

    private final PayrollCsvExporter       csvExporter;
    private final ApplicationEventPublisher eventPublisher;

    public void execute(String periodStr, OutputStream out) throws IOException {
        PayrollPeriod period = PayrollPeriod.parse(periodStr);
        Authentication auth  = currentAuth();

        // ── Domain Policy gate ────────────────────────────────────────────────
        PayrollAccessPolicy.Principal principal = resolvePolicy(auth);
        PayrollAccessPolicy.requireCanExport(principal);

        log.info("[Export] {} initiated CSV export for period {}", principal.userId(), periodStr);

        // ── Streaming export — delegate to infrastructure ─────────────────────
        csvExporter.export(period.month(), period.year(), out);

        // ── Audit extension point (event listener not yet implemented) ─────────
        eventPublisher.publishEvent(new PayrollExportedEvent(
                periodStr,
                principal.userId().toString(),
                Instant.now()
        ));
    }

    // ── Security ──────────────────────────────────────────────────────────────

    private Authentication currentAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new ForbiddenException();
        return auth;
    }

    private PayrollAccessPolicy.Principal resolvePolicy(Authentication auth) {
        if (!(auth.getPrincipal() instanceof CustomUserPrincipal cp)) {
            throw new ForbiddenException();
        }
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .filter(r -> List.of("ADMIN", "HR", "MANAGER", "EMPLOYEE").contains(r))
                .findFirst()
                .orElse("EMPLOYEE");
        return new PayrollAccessPolicy.Principal(cp.getUserId(), null, role);
    }
}
