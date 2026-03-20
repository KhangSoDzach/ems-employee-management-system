package com.company.ems.backend.common.constant;
public final class AppConstant {

    private AppConstant() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String ROLE_EMPLOYEE = "EMPLOYEE";

    public static final String JWT_ERROR_CODE_ATTR = "jwtErrorCode";
}
