/**
 * Audit Log Constants
 * Used for logic (ENUM) and display (LABEL/TEXT)
 */

export const AUDIT_ACTION_ENUM = {
    LOGIN: "LOGIN", // legacy support
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGOUT: "LOGOUT",
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    PASSWORD_CHANGE: "PASSWORD_CHANGE",
    ACCESS_DENIED: "ACCESS_DENIED",
    SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    TOKEN_REFRESH: "TOKEN_REFRESH",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    UPDATE_EMPLOYEE: "UPDATE_EMPLOYEE",
    CHECK_IN: "CHECK_IN",
    CHECK_OUT: "CHECK_OUT",
    PAYROLL_RUN: "PAYROLL_RUN",
} as const;

export const AUDIT_ACTION_LABEL = {
    [AUDIT_ACTION_ENUM.LOGIN]: "Đăng nhập",
    [AUDIT_ACTION_ENUM.LOGIN_SUCCESS]: "Đăng nhập thành công",
    [AUDIT_ACTION_ENUM.LOGIN_FAILED]: "Đăng nhập thất bại",
    [AUDIT_ACTION_ENUM.LOGOUT]: "Đăng xuất",
    [AUDIT_ACTION_ENUM.CREATE]: "Thêm mới (Create)",
    [AUDIT_ACTION_ENUM.UPDATE]: "Cập nhật (Update)",
    [AUDIT_ACTION_ENUM.DELETE]: "Xóa (Delete)",
    [AUDIT_ACTION_ENUM.PASSWORD_CHANGE]: "Đổi mật khẩu",
    [AUDIT_ACTION_ENUM.ACCESS_DENIED]: "Từ chối truy cập",
    [AUDIT_ACTION_ENUM.SUSPICIOUS_ACTIVITY]: "Hoạt động nghi vấn",
    [AUDIT_ACTION_ENUM.RATE_LIMIT_EXCEEDED]: "Vượt quá giới hạn truy cập",
    [AUDIT_ACTION_ENUM.TOKEN_REFRESH]: "Làm mới token",
    [AUDIT_ACTION_ENUM.TOKEN_EXPIRED]: "Token hết hạn",
    [AUDIT_ACTION_ENUM.UPDATE_EMPLOYEE]: "Cập nhật nhân viên",
    [AUDIT_ACTION_ENUM.CHECK_IN]: "Chấm công (Check-in)",
    [AUDIT_ACTION_ENUM.CHECK_OUT]: "Chấm công (Check-out)",
    [AUDIT_ACTION_ENUM.PAYROLL_RUN]: "Chạy bảng lương",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTION_ENUM;

export const AUDIT_RESOURCE_ENUM = {
    AUTH: "AUTH",
    EMPLOYEE: "EMPLOYEE",
    PAYROLL: "PAYROLL",
    LEAVE: "LEAVE",
    ATTENDANCE: "ATTENDANCE",
    ASSET: "ASSET",
    SYSTEM: "SYSTEM",
} as const;

export const AUDIT_RESOURCE_LABEL = {
    [AUDIT_RESOURCE_ENUM.AUTH]: "Xác thực (Auth)",
    [AUDIT_RESOURCE_ENUM.EMPLOYEE]: "Nhân viên",
    [AUDIT_RESOURCE_ENUM.PAYROLL]: "Bảng lương",
    [AUDIT_RESOURCE_ENUM.LEAVE]: "Nghỉ phép",
    [AUDIT_RESOURCE_ENUM.ATTENDANCE]: "Chấm công",
    [AUDIT_RESOURCE_ENUM.ASSET]: "Tài sản",
    [AUDIT_RESOURCE_ENUM.SYSTEM]: "Hệ thống",
} as const;

export const AUDIT_CATEGORY_LABEL = {
    AUTHENTICATION: "Xác thực",
    AUTHORIZATION: "Phân quyền",
    SECURITY: "Bảo mật",
    DATA_CHANGE: "Thay đổi dữ liệu",
} as const;
