package com.company.ems.backend.common.constant;

public final class AppRole {

    private AppRole() {}
    public static final String EMPLOYEE = "EMPLOYEE";
    public static final String MANAGER  = "MANAGER";
    public static final String HR       = "HR";
    public static final String ADMIN    = "ADMIN";
    public static final String HAS_ANY
            = "hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')";

    public static final String HAS_EMPLOYEE_OR_ABOVE
            = "hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')";

    public static final String HAS_MANAGER_OR_ABOVE
            = "hasAnyRole('MANAGER','HR','ADMIN')";

    public static final String HAS_HR_OR_ADMIN
            = "hasAnyRole('HR','ADMIN')";

    public static final String HAS_ADMIN_ONLY
            = "hasRole('ADMIN')";
}