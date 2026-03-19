// src/constants/validations.ts

export const FORM_VALIDATION_MESSAGES = {
    MISSING_CONTENT: "Vui lòng điền đầy đủ nội dung",
    REQUIRED: "Trường này là bắt buộc",
    NAME_MIN: "Họ tên phải từ 2 ký tự",
    NAME_MAX: "Họ tên không quá 255 ký tự",
    ID_FORMAT: "CMND/CCCD phải là 9 hoặc 12 số",
    EMAIL_INVALID: "Email không hợp lệ",
    PHONE_FORMAT: "SĐT phải từ 10-13 số",
    DOB_REQUIRED: "Vui lòng chọn ngày sinh",
    AGE_MIN: "Nhân viên phải từ 18 tuổi trở lên",
    START_DATE_REQUIRED: "Vui lòng chọn ngày bắt đầu",
    DEPT_REQUIRED: "Vui lòng chọn phòng ban",
    ROLE_REQUIRED: "Vui lòng chọn vị trí",
    MANAGER_REQUIRED: "Vui lòng chọn quản lý",
    REASON_REQUIRED: "Vui lòng nhập lý do",
    MIN_LENGTH: (min: number) => `Vui lòng nhập tối thiểu ${min} ký tự`,
    MAX_LENGTH: (max: number) => `Độ dài không vượt quá ${max} ký tự`,
    // Password & OTP
    PASSWORD_MIN: "Mật khẩu phải có ít nhất 8 ký tự",
    PASSWORD_MISMATCH: "Mật khẩu xác nhận không khớp",
    OTP_LENGTH: "Mã OTP phải có đúng 6 chữ số",
    OTP_NUMERIC: "Mã OTP chỉ được chứa số",
};
