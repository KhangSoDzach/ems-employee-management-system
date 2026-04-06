package com.company.ems.backend.payroll.domain.valueobject;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public record PayrollPeriod(int year, int month) {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    public PayrollPeriod {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException(
                    "Invalid month: " + month + ". Must be between 1 and 12.");
        }
        if (year < 2000) {
            throw new IllegalArgumentException(
                    "Invalid year: " + year + ". Must be 2000 or later.");
        }
    }

    public static PayrollPeriod parse(String period) {
        if (period == null || period.isBlank()) {
            throw new IllegalArgumentException("Period must not be blank");
        }
        try {
            YearMonth ym = YearMonth.parse(period.trim(), FMT);
            return new PayrollPeriod(ym.getYear(), ym.getMonthValue());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Invalid period format: '" + period + "'. Expected yyyy-MM (e.g. 2026-03)");
        }
    }

    public static PayrollPeriod of(int year, int month) {
        return new PayrollPeriod(year, month);
    }

    public String asString() {
        return YearMonth.of(year, month).format(FMT);
    }

    @Override
    public String toString() {
        return asString();
    }
}
