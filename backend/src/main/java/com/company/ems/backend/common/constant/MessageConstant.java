package com.company.ems.backend.common.constant;

/**
 * Message constants for API responses
 */
public final class MessageConstant {

    private MessageConstant() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }

    // Success messages
    public static final String SUCCESS = "Operation completed successfully";
    public static final String CREATED = "Resource created successfully";
    public static final String UPDATED = "Resource updated successfully";
    public static final String DELETED = "Resource deleted successfully";

    // Employee messages
    public static final String EMPLOYEE_CREATED = "Employee created successfully";
    public static final String EMPLOYEE_UPDATED = "Employee updated successfully";
    public static final String EMPLOYEE_DELETED = "Employee deleted successfully";
    public static final String EMPLOYEE_NOT_FOUND = "Employee not found";
    public static final String EMPLOYEE_EMAIL_EXISTS = "Email already exists";

    // Attendance messages
    public static final String ATTENDANCE_CHECKED_IN = "Checked in successfully";
    public static final String ATTENDANCE_CHECKED_OUT = "Checked out successfully";
    public static final String ATTENDANCE_ALREADY_CHECKED_IN = "Already checked in for today";
    public static final String ATTENDANCE_NOT_FOUND = "Attendance record not found";

    // Leave messages
    public static final String LEAVE_REQUESTED = "Leave request submitted successfully";
    public static final String LEAVE_APPROVED = "Leave request approved";
    public static final String LEAVE_REJECTED = "Leave request rejected";
    public static final String LEAVE_CANCELLED = "Leave request cancelled";
    public static final String LEAVE_NOT_FOUND = "Leave request not found";
    public static final String LEAVE_ALREADY_APPROVED = "Leave request already approved";
    public static final String LEAVE_INVALID_DATE_RANGE = "Invalid date range";

    // Authentication messages
    public static final String LOGIN_SUCCESS = "Login successful";
    public static final String LOGIN_FAILED = "Invalid username or password";
    public static final String LOGOUT_SUCCESS = "Logout successful";
    public static final String TOKEN_EXPIRED = "Token has expired";
    public static final String TOKEN_INVALID = "Invalid token";
    public static final String UNAUTHORIZED = "Unauthorized access";
    public static final String ACCESS_DENIED = "Access denied";

    // User messages
    public static final String USER_CREATED = "User created successfully";
    public static final String USER_UPDATED = "User updated successfully";
    public static final String USER_DELETED = "User deleted successfully";
    public static final String USER_NOT_FOUND = "User not found";
    public static final String USER_ALREADY_EXISTS = "User already exists";

    // Validation messages
    public static final String VALIDATION_FAILED = "Validation failed";
    public static final String REQUIRED_FIELD = "This field is required";
    public static final String INVALID_EMAIL = "Invalid email format";
    public static final String INVALID_PHONE = "Invalid phone number format";
    public static final String INVALID_DATE = "Invalid date format";

    // Error messages
    public static final String INTERNAL_SERVER_ERROR = "An unexpected error occurred";
    public static final String BAD_REQUEST = "Invalid request";
    public static final String NOT_FOUND = "Resource not found";
    public static final String CONFLICT = "Resource already exists";
}
