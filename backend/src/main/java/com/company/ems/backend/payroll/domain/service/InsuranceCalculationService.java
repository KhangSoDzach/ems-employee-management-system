package com.company.ems.backend.payroll.domain.service;

import com.company.ems.backend.payroll.domain.valueobject.Money;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class InsuranceCalculationService {
    public record InsuranceResult(
            Money bhxh,
            Money bhyt,
            Money bhtn,
            Money total
    ) {
        public static InsuranceResult of(Money bhxh, Money bhyt, Money bhtn) {
            return new InsuranceResult(bhxh, bhyt, bhtn, bhxh.add(bhyt).add(bhtn));
        }

        public static InsuranceResult zero() {
            return of(Money.zero(), Money.zero(), Money.zero());
        }
    }

    public InsuranceResult calculate(Money insurableBase, List<SalaryComponent> components) {
        if (insurableBase.isZeroOrNegative()) {
            return InsuranceResult.zero();
        }

        Money bhxh = Money.zero();
        Money bhyt = Money.zero();
        Money bhtn = Money.zero();

        for (SalaryComponent comp : components) {
            if (comp.getType() != SalaryComponentType.INSURANCE) continue;
            if (comp.getRatePercent() == null)                     continue;

            BigDecimal rate = comp.getRatePercent()
                    .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);

            Money deduction = insurableBase.multiply(rate);
            String code     = comp.getCode().toUpperCase();

            if      (code.contains("BHXH")) bhxh = deduction;
            else if (code.contains("BHYT")) bhyt = deduction;
            else if (code.contains("BHTN")) bhtn = deduction;
        }

        return InsuranceResult.of(bhxh, bhyt, bhtn);
    }
}
