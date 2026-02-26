package com.company.ems.backend.employee.search.service;

import java.util.Set;
public final class AllowedSortFields {

    private AllowedSortFields() {}

    public static final Set<String> EMPLOYEE_SORT_FIELDS = Set.of(
            "firstName",
            "lastName",
            "email",
            "employeeCode",
            "hireDate",
            "status",
            "createdAt"
    );

    public static final String DEFAULT_SORT_FIELD = "firstName";

    public static String validateSortField(String requestedField) {
        if (requestedField == null || requestedField.isBlank()) {
            return DEFAULT_SORT_FIELD;
        }
        String field = requestedField.trim();
        if (!EMPLOYEE_SORT_FIELDS.contains(field)) {
            throw new IllegalArgumentException(
                    "Sort field '" + field + "' không được phép. " +
                            "Chỉ cho phép: " + EMPLOYEE_SORT_FIELDS
            );
        }
        return field;
    }
}