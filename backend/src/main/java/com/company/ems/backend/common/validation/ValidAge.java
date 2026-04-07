package com.company.ems.backend.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = AgeValidator.class)
@Target({ ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidAge {
    String message() default ValidationMessages.EMPLOYEE_AGE_RANGE;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    int min() default 18;

    int max() default 70;
}
