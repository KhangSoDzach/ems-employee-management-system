package com.company.ems.backend.payroll.application.usecase;

import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.payroll.domain.service.PayrollCalculationService;
import com.company.ems.backend.payroll.domain.service.PayrollCalculationService.PayrollCalculationResult;
import com.company.ems.backend.payroll.domain.valueobject.Money;
import com.company.ems.backend.payroll.domain.valueobject.PayrollPeriod;
import com.company.ems.backend.payroll.entity.AuditLog;
import com.company.ems.backend.payroll.entity.Payroll;
import com.company.ems.backend.payroll.entity.PayrollItem;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.PayrollStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentAuditAction;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.repository.PayrollAuditLogRepository;
import com.company.ems.backend.payroll.repository.PayrollItemRepository;
import com.company.ems.backend.payroll.repository.PayrollRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;
import com.company.ems.backend.salary.entity.Salary;
import com.company.ems.backend.salary.repository.SalaryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
@Service
@RequiredArgsConstructor
@Slf4j
public class RunPayrollUseCase {

    private final EmployeeRepository        employeeRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    private final SalaryRepository          salaryRepository;
    private final PayrollRepository         payrollRepository;
    private final PayrollItemRepository     payrollItemRepository;
    private final PayrollAuditLogRepository auditLogRepository;
    private final PayrollCalculationService calculationService;

    @Transactional
    public RunPayrollResult execute(RunPayrollCommand cmd) {
        log.info("[Payroll] Run started — period={} by={}", cmd.period(), cmd.requestedBy());

        PayrollPeriod period    = PayrollPeriod.parse(cmd.period());
        List<Employee> employees = employeeRepository.findAllActive();
        List<SalaryComponent> components = loadActiveComponents();

        log.debug("[Payroll] {} active employees, {} active components",
                employees.size(), components.size());

        int processed = 0;
        int skipped   = 0;

        for (Employee employee : employees) {
            if (processEmployee(employee, period, components)) processed++;
            else                                                skipped++;
        }

        BigDecimal totalPayroll = payrollRepository.sumNetPayByPeriod(period.month(), period.year());
        writeRunAuditLog(cmd, period, processed, skipped, totalPayroll);

        log.info("[Payroll] Done — period={} processed={} skipped={} total={}",
                period, processed, skipped, totalPayroll);

        return RunPayrollResult.success(cmd.period(), processed, skipped, totalPayroll);
    }

    private boolean processEmployee(Employee employee, PayrollPeriod period,
                                    List<SalaryComponent> components) {
        LocalDate periodStart = LocalDate.of(period.year(), period.month(), 1);

        Optional<Salary> salaryOpt = salaryRepository
                .findActiveByEmployeeAndDate(employee.getId(), periodStart);

        if (salaryOpt.isEmpty()) {
            log.warn("[Payroll] No active salary for employee id={} ({}), skipping",
                    employee.getId(), employee.getEmail());
            return false;
        }

        PayrollCalculationResult result =
                calculationService.calculate(employee, salaryOpt.get(), components, period);

        Payroll payroll = upsertPayroll(employee, period, result);
        persistPayrollItems(payroll, result, components);

        log.debug("[Payroll] employee={} gross={} net={}",
                employee.getId(), result.grossSalary(), result.netSalary());
        return true;
    }

    private Payroll upsertPayroll(Employee employee, PayrollPeriod period,
                                   PayrollCalculationResult result) {
        return payrollRepository
                .findByEmployeeIdAndPeriod(employee.getId(), period.month(), period.year())
                .map(existing -> updatePayroll(existing, result))
                .orElseGet(() -> createPayroll(employee, period, result));
    }

    private Payroll createPayroll(Employee employee, PayrollPeriod period,
                                   PayrollCalculationResult result) {
        Payroll p = Payroll.builder()
                .employee(employee)
                .payrollMonth(period.month())
                .payrollYear(period.year())
                .basicSalary(result.basicSalary().amount())
                .allowances(result.allowances().amount())
                .bonus(result.bonus().amount())
                .overtimePay(BigDecimal.ZERO)
                // insuranceDeduction = BHXH+BHYT+BHTN + CONG_DOAN_PHI + other deductions
                .insuranceDeduction(result.totalNonTaxDeductions().amount())
                .taxDeduction(BigDecimal.ZERO)   // PIT không áp dụng
                .netPay(result.netSalary().amount())
                .status(PayrollStatus.PROCESSED)
                .build();
        return payrollRepository.save(p);
    }

    private Payroll updatePayroll(Payroll existing, PayrollCalculationResult result) {
        existing.setBasicSalary(result.basicSalary().amount());
        existing.setAllowances(result.allowances().amount());
        existing.setBonus(result.bonus().amount());
        existing.setInsuranceDeduction(result.totalNonTaxDeductions().amount());
        existing.setTaxDeduction(BigDecimal.ZERO);   // PIT không áp dụng
        existing.setNetPay(result.netSalary().amount());
        existing.setStatus(PayrollStatus.PROCESSED);
        return payrollRepository.save(existing);
    }

    private void persistPayrollItems(Payroll payroll, PayrollCalculationResult result,
                                      List<SalaryComponent> components) {
        payrollItemRepository.deleteByPayrollId(payroll.getId());

        List<PayrollItem> items = new ArrayList<>();
        if (result.bhxh().isPositive())
            items.add(PayrollItem.forInsurance(payroll, "BHXH", "Bảo hiểm xã hội", result.bhxh()));
        if (result.bhyt().isPositive())
            items.add(PayrollItem.forInsurance(payroll, "BHYT", "Bảo hiểm y tế", result.bhyt()));
        if (result.bhtn().isPositive())
            items.add(PayrollItem.forInsurance(payroll, "BHTN", "Bảo hiểm thất nghiệp", result.bhtn()));
        for (SalaryComponent comp : components) {
            if (comp.getType() != SalaryComponentType.DEDUCTION)     continue;
            if (comp.getNature() != SalaryComponentNature.DEDUCTION) continue;

            Money amount = resolveComponentAmount(comp, result.grossSalary());
            if (amount.isPositive()) {
                items.add(PayrollItem.forComponent(payroll, comp, amount));
            }
        }

        payrollItemRepository.saveAll(items);
    }

    private Money resolveComponentAmount(SalaryComponent c, Money gross) {
        if (c.getAmount() != null) return Money.of(c.getAmount());
        if (c.getRatePercent() != null) {
            BigDecimal rate = c.getRatePercent()
                    .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
            return gross.multiply(rate);
        }
        return Money.zero();
    }

    private List<SalaryComponent> loadActiveComponents() {
        return salaryComponentRepository
                .findAllByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .filter(c -> c.getStatus() == SalaryComponentStatus.ACTIVE)
                .toList();
    }

    private void writeRunAuditLog(RunPayrollCommand cmd, PayrollPeriod period,
                                   int processed, int skipped, BigDecimal total) {
        AuditLog entry = AuditLog.builder()
                .entityType("PAYROLL_RUN")
                .entityId(null)
                .actionType(SalaryComponentAuditAction.CREATE)
                .actor(cmd.requestedBy())
                .newValue(String.format(
                        "{\"period\":\"%s\",\"processedEmployees\":%d,\"skippedEmployees\":%d," +
                        "\"totalPayroll\":\"%s\",\"triggeredBy\":\"%s\"}",
                        period.asString(), processed, skipped,
                        total != null ? total.toPlainString() : "0",
                        cmd.requestedBy()))
                .build();
        auditLogRepository.save(entry);
    }
}
