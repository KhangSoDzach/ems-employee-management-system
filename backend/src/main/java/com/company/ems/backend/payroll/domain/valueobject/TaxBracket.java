package com.company.ems.backend.payroll.domain.valueobject;

import java.math.BigDecimal;

public record TaxBracket(
        BigDecimal lowerLimit,   // inclusive lower bound (VND)
        BigDecimal upperLimit,   // exclusive upper bound; null = unbounded
        BigDecimal rate          // decimal rate, e.g. 0.05 for 5%
) {
    public boolean appliesTo(BigDecimal income) {
        boolean aboveLower = income.compareTo(lowerLimit) > 0;
        boolean belowUpper = upperLimit == null || income.compareTo(upperLimit) <= 0;
        return aboveLower && belowUpper;
    }
    public BigDecimal taxablePortionOf(BigDecimal income) {
        if (income.compareTo(lowerLimit) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal cap = (upperLimit != null)
                ? upperLimit.min(income)
                : income;
        return cap.subtract(lowerLimit);
    }

    public static TaxBracket bounded(long lower, long upper, String rate) {
        return new TaxBracket(
                BigDecimal.valueOf(lower),
                BigDecimal.valueOf(upper),
                new BigDecimal(rate));
    }

    public static TaxBracket unbounded(long lower, String rate) {
        return new TaxBracket(BigDecimal.valueOf(lower), null, new BigDecimal(rate));
    }
}
