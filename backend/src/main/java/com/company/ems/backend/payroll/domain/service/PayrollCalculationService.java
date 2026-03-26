package com.company.ems.backend.payroll.domain.service;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.payroll.domain.valueobject.Money;
import com.company.ems.backend.payroll.domain.valueobject.PayrollPeriod;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.salary.entity.Salary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PayrollCalculationService {


    private final InsuranceCalculationService insuranceService;

    public PayrollCalculationService(
            InsuranceCalculationService insuranceService) {
        this.insuranceService = insuranceService;
    }

    public record PayrollCalculationResult(
            Money basicSalary,
            Money allowances,
            Money bonus,
            Money grossSalary,
            Money bhxh,
            Money bhyt,
            Money bhtn,
            Money insuranceDeduction,
            Money otherDeductions,
            Money taxableIncome,
            Money netSalary
    ) {
        public Money totalNonTaxDeductions() {
            return insuranceDeduction.add(otherDeductions);
        }
    }

    public PayrollCalculationResult calculate(
            Employee employee,
            Salary salary,
            List<SalaryComponent> components,
            PayrollPeriod period) {

        Money basicSalary = Money.of(salary.getBasicSalary());
        Money allowances  = computeAllowances(components, basicSalary);
        Money bonus       = computeBonus(components, basicSalary);
        Money grossSalary = basicSalary.add(allowances).add(bonus);
        InsuranceCalculationService.InsuranceResult insurance =
                insuranceService.calculate(grossSalary, components);

        Money otherDeductions = computeOtherDeductions(components, grossSalary);

        Money taxableIncome = grossSalary
                .subtract(insurance.total())
                .subtract(otherDeductions);

        Money netSalary = grossSalary
                .subtract(insurance.total())
                .subtract(otherDeductions);

        return new PayrollCalculationResult(
                basicSalary, allowances, bonus, grossSalary,
                insurance.bhxh(), insurance.bhyt(), insurance.bhtn(), insurance.total(),
                otherDeductions,
                taxableIncome,
                netSalary
        );
    }

    private Money computeAllowances(List<SalaryComponent> components, Money base) {
        Money total = Money.zero();
        for (SalaryComponent c : components) {
            if (c.getType() != SalaryComponentType.ALLOWANCE)  continue;
            if (c.getNature() != SalaryComponentNature.INCOME) continue;
            total = total.add(resolveAmount(c, base));
        }
        return total;
    }

    private Money computeBonus(List<SalaryComponent> components, Money base) {
        Money total = Money.zero();
        for (SalaryComponent c : components) {
            if (c.getType() != SalaryComponentType.BONUS)      continue;
            if (c.getNature() != SalaryComponentNature.INCOME) continue;
            total = total.add(resolveAmount(c, base));
        }
        return total;
    }

    private Money computeOtherDeductions(List<SalaryComponent> components, Money gross) {
        Money total = Money.zero();
        for (SalaryComponent c : components) {
            if (c.getType() != SalaryComponentType.DEDUCTION)     continue;
            if (c.getNature() != SalaryComponentNature.DEDUCTION) continue;
            total = total.add(resolveAmount(c, gross));
        }
        return total;
    }

    private Money resolveAmount(SalaryComponent c, Money base) {
        if (c.getAmount() != null) {
            return Money.of(c.getAmount());
        }
        if (c.getRatePercent() != null) {
            BigDecimal rate = c.getRatePercent()
                    .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
            return base.multiply(rate);
        }
        return Money.zero();
    }
}
