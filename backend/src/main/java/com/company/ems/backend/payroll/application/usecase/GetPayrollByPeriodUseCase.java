package com.company.ems.backend.payroll.application.usecase;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.payroll.domain.policy.PayrollAccessPolicy;
import com.company.ems.backend.payroll.domain.valueobject.PayrollPeriod;
import com.company.ems.backend.payroll.entity.Payroll;
import com.company.ems.backend.payroll.enums.PayrollStatus;
import com.company.ems.backend.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetPayrollByPeriodUseCase {

    private final PayrollRepository   payrollRepository;
    private final EmployeeRepository  employeeRepository;

    public record PayrollSummaryDto(
            Long       payrollId,
            String     employeeCode,
            String     employeeName,
            String     department,
            String     period,
            BigDecimal basicSalary,
            BigDecimal allowances,
            BigDecimal insuranceDeduction,
            BigDecimal taxDeduction,
            BigDecimal netPay,
            String     status
    ) {}

    public record PeriodPayrollResult(
            String               period,
            int                  totalEmployees,
            BigDecimal           totalNetPayroll,
            List<PayrollSummaryDto> payrolls
    ) {}

    public PeriodPayrollResult execute(String periodStr) {
        PayrollPeriod period = PayrollPeriod.parse(periodStr);
        PayrollAccessPolicy.requireCanViewPeriod(resolveCurrentPrincipal());
        List<Payroll> payrolls = payrollRepository
                .findByPeriodWithEmployee(period.month(), period.year());

        List<PayrollSummaryDto> dtos = payrolls.stream()
                .map(this::toSummary)
                .toList();

        BigDecimal totalNet = dtos.stream()
                .map(PayrollSummaryDto::netPay)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PeriodPayrollResult(
                periodStr,
                dtos.size(),
                totalNet,
                dtos
        );
    }

    private PayrollSummaryDto toSummary(Payroll p) {
        String empName = p.getEmployee().getFirstName()
                + " " + p.getEmployee().getLastName();
        String dept = p.getEmployee().getDepartment() != null
                ? p.getEmployee().getDepartment().getName()
                : "—";
        String period = String.format("%02d/%d",
                p.getPayrollMonth(), p.getPayrollYear());

        return new PayrollSummaryDto(
                p.getId(),
                p.getEmployee().getEmployeeCode(),
                empName,
                dept,
                period,
                p.getBasicSalary(),
                nvl(p.getAllowances()),
                nvl(p.getInsuranceDeduction()),
                nvl(p.getTaxDeduction()),
                nvl(p.getNetPay()),
                p.getStatus().name()
        );
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private PayrollAccessPolicy.Principal resolveCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserPrincipal cp)) {
            throw new ForbiddenException();
        }
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .filter(r -> List.of("ADMIN","HR","MANAGER","EMPLOYEE").contains(r))
                .findFirst()
                .orElse("EMPLOYEE");

        return new PayrollAccessPolicy.Principal(cp.getUserId(), null, role);
    }
}
