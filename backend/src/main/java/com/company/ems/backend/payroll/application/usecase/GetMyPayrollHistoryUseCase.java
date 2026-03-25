package com.company.ems.backend.payroll.application.usecase;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.payroll.entity.Payroll;
import com.company.ems.backend.payroll.entity.PayrollItem;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.repository.PayrollItemRepository;
import com.company.ems.backend.payroll.repository.PayrollRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetMyPayrollHistoryUseCase {

    private final EmployeeRepository       employeeRepository;
    private final PayrollRepository        payrollRepository;
    private final PayrollItemRepository    payrollItemRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    public record DeductionItem(String label, String amount) {}
    public record AllowanceItem(String label, String amount) {}

    public record PayrollSlipDto(
            Long   id,
            String period,
            String paymentDate,
            String baseSalary,
            List<AllowanceItem> allowances,
            List<AllowanceItem> bonus,
            List<DeductionItem> deductions,
            String totalIncome,
            String totalDeductions,
            String netPay,
            String status
    ) {}

    public List<PayrollSlipDto> execute() {
        Long userId      = currentUserId();
        Long employeeId  = employeeRepository.findEmployeeIdByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ nhân viên cho tài khoản hiện tại"));

        List<SalaryComponent> activeComponents = salaryComponentRepository
                .findAllByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .filter(c -> c.getStatus() == SalaryComponentStatus.ACTIVE)
                .toList();

        List<Payroll> payrolls = payrollRepository.findAllByEmployeeIdOrderByDesc(employeeId);

        return payrolls.stream()
                .map(p -> toDto(p,
                        payrollItemRepository.findByPayrollId(p.getId()),
                        activeComponents))
                .toList();
    }

    private PayrollSlipDto toDto(Payroll p, List<PayrollItem> items,
                                  List<SalaryComponent> components) {

        String period = String.format("Tháng %02d/%d", p.getPayrollMonth(), p.getPayrollYear());

        String paymentDate = p.getPaymentDate() != null
                ? p.getPaymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : String.format("05/%02d/%d",
                        p.getPayrollMonth() == 12 ? 1 : p.getPayrollMonth() + 1,
                        p.getPayrollMonth() == 12 ? p.getPayrollYear() + 1 : p.getPayrollYear());

        List<AllowanceItem> allowances = buildAllowanceItems(p, components);

        List<DeductionItem> deductions = buildDeductionItems(items);

        BigDecimal gross    = p.getGrossPay();
        BigDecimal totalDed = p.getTotalDeductions();
        BigDecimal net      = p.getNetPay() != null ? p.getNetPay() : BigDecimal.ZERO;

        String statusStr = switch (p.getStatus()) {
            case PAID, PROCESSED -> "paid";
            default              -> "pending";
        };

        return new PayrollSlipDto(
                p.getId(),
                period,
                paymentDate,
                fmtVnd(p.getBasicSalary()),
                allowances,
                List.of(),          // bonus removed per business requirement
                deductions,
                fmtVnd(gross),
                fmtVnd(totalDed),
                fmtVnd(net),
                statusStr
        );
    }

    private List<AllowanceItem> buildAllowanceItems(Payroll p,
                                                     List<SalaryComponent> components) {
        BigDecimal basic = p.getBasicSalary();
        List<AllowanceItem> result = new ArrayList<>();

        for (SalaryComponent comp : components) {
            if (comp.getType() != SalaryComponentType.ALLOWANCE)  continue;
            if (comp.getNature() != SalaryComponentNature.INCOME) continue;

            BigDecimal amount = resolveAmount(comp, basic);
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                result.add(new AllowanceItem(comp.getName(), fmtVnd(amount)));
            }
        }
        return result;
    }

    private List<DeductionItem> buildDeductionItems(List<PayrollItem> items) {
        if (items.isEmpty()) return List.of();

        return items.stream()
                .filter(i -> !"PIT".equalsIgnoreCase(i.getComponentCode())) // PIT không hiển thị
                .filter(i -> i.getNature() == SalaryComponentNature.DEDUCTION
                          || i.getComponentType() == SalaryComponentType.INSURANCE)
                .map(i -> {
                    String label = i.getRatePercent() != null
                            ? String.format("%s (%.1f%%)", i.getComponentName(),
                                    i.getRatePercent().doubleValue())
                            : i.getComponentName();
                    return new DeductionItem(label, fmtVnd(i.getComputedAmount()));
                })
                .toList();
    }

    private BigDecimal resolveAmount(SalaryComponent comp, BigDecimal base) {
        if (comp.getAmount() != null) return comp.getAmount();
        if (comp.getRatePercent() != null) {
            return base.multiply(comp.getRatePercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private static String fmtVnd(BigDecimal amount) {
        if (amount == null) return "0đ";
        // Format WITHOUT decimal separator issues:
        // Use plain long formatting then add dots manually for vi-VN display
        long val = amount.setScale(0, RoundingMode.HALF_UP).longValue();
        return String.format("%,d", val).replace(",", ".") + "đ";
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserPrincipal p) {
            return p.getUserId();
        }
        throw new com.company.ems.backend.common.exception.ForbiddenException();
    }
}
