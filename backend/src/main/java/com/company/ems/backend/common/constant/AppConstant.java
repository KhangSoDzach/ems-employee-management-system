package com.company.ems.backend.common.constant;

public final class AppConstant {

    private AppConstant() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // Pagination
    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "10";
    public static final String MAX_PAGE_SIZE = "100";
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";

    // Date formats
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String TIME_FORMAT = "HH:mm:ss";

    // Employee status
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_TERMINATED = "TERMINATED";

    // Attendance status
    public static final String ATTENDANCE_PRESENT = "PRESENT";
    public static final String ATTENDANCE_ABSENT = "ABSENT";
    public static final String ATTENDANCE_LATE = "LATE";
    public static final String ATTENDANCE_HALF_DAY = "HALF_DAY";

    // Leave status
    public static final String LEAVE_PENDING = "PENDING";
    public static final String LEAVE_REJECTED = "REJECTED";
    public static final String LEAVE_CANCELLED = "CANCELLED";

    // Leave types
    public static final String LEAVE_TYPE_ANNUAL = "ANNUAL";
    public static final String LEAVE_TYPE_SICK = "SICK";
    public static final String LEAVE_TYPE_PERSONAL = "PERSONAL";
    public static final String LEAVE_TYPE_UNPAID = "UNPAID";

    // Roles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String ROLE_EMPLOYEE = "EMPLOYEE";

    public static final String LEAVE_APPROVED = "APPROVED";

    // Security
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final String TOKEN_TYPE = "JWT";

    public static final String JWT_ERROR_CODE_ATTR = "jwtErrorCode";
    public static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    public static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif"};
    public static final String[] ALLOWED_DOCUMENT_TYPES = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };
}