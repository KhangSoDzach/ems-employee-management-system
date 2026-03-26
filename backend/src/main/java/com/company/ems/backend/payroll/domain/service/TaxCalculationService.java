package com.company.ems.backend.payroll.domain.service;

import com.company.ems.backend.payroll.domain.valueobject.Money;
import com.company.ems.backend.payroll.domain.valueobject.TaxBracket;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
@Service
public class TaxCalculationService {

    private static final List<TaxBracket> BRACKETS = List.of(
            TaxBracket.bounded(         0L,  5_000_000L, "0.05"),
            TaxBracket.bounded( 5_000_000L, 10_000_000L, "0.10"),
            TaxBracket.bounded(10_000_000L, 18_000_000L, "0.15"),
            TaxBracket.bounded(18_000_000L, 32_000_000L, "0.20"),
            TaxBracket.bounded(32_000_000L, 52_000_000L, "0.25"),
            TaxBracket.bounded(52_000_000L, 80_000_000L, "0.30"),
            TaxBracket.unbounded(80_000_000L,             "0.35")
    );

    public Money calculate(Money taxableIncome) {
        if (taxableIncome.isZeroOrNegative()) {
            return Money.zero();
        }

        BigDecimal income   = taxableIncome.amount();
        BigDecimal totalTax = BigDecimal.ZERO;

        for (TaxBracket bracket : BRACKETS) {
            if (!bracket.appliesTo(income)) continue;

            BigDecimal taxablePortion = bracket.taxablePortionOf(income);
            BigDecimal tax            = taxablePortion.multiply(bracket.rate());
            totalTax = totalTax.add(tax);
        }

        return Money.of(totalTax.setScale(2, RoundingMode.HALF_UP));
    }

    public List<TaxBracket> getBrackets() {
        return List.copyOf(BRACKETS);
    }
}
