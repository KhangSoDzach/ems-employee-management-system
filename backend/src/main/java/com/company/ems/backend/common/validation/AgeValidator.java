package com.company.ems.backend.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class AgeValidator implements ConstraintValidator<ValidAge, LocalDate> {
    private int min;
    private int max;

    @Override
    public void initialize(ValidAge constraintAnnotation) {
        this.min = constraintAnnotation.min();
        this.max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(LocalDate dateOfBirth, ConstraintValidatorContext context) {
        if (dateOfBirth == null)
            return true; // Handled by @NotNull
        long age = ChronoUnit.YEARS.between(dateOfBirth, LocalDate.now());
        return age >= min && age <= max;
    }
}
