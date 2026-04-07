/**
 * @file attendance-validation.ts
 * @description Constants for attendance configuration validation messages.
 * Centralized in src/constants.
 */

export const ATTENDANCE_VALIDATION_MESSAGES = {
  // Time rules
  SHIFT_1_START_REQUIRED: "Giờ vào ca 1 là bắt buộc.",
  SHIFT_1_END_REQUIRED: "Giờ tan ca 1 là bắt buộc.",
  SHIFT_1_END_AFTER_START: "Giờ tan ca 1 phải lớn hơn giờ vào ca 1.",

  SHIFT_2_START_REQUIRED: "Giờ vào ca 2 là bắt buộc.",
  SHIFT_2_END_REQUIRED: "Giờ tan ca 2 là bắt buộc.",
  SHIFT_2_END_AFTER_START: "Giờ tan ca 2 phải lớn hơn giờ vào ca 2.",
  SHIFT_2_START_AFTER_SHIFT_1_END:
    "Giờ vào ca 2 phải lớn hơn hoặc bằng giờ tan ca 1.",

  LATE_TOLERANCE_INVALID:
    "Thời gian đi muộn cho phép phải là số và không được âm.",
  EARLY_LEAVE_TOLERANCE_INVALID:
    "Thời gian về sớm cho phép phải là số và không được âm.",

  // Main location rules
  LATITUDE_INVALID: "Vĩ độ (Latitude) phải là số từ -90 đến 90.",
  LONGITUDE_INVALID: "Kinh độ (Longitude) phải là số từ -180 đến 180.",
  RADIUS_INVALID: "Bán kính hợp lệ phải là số dương (> 0).",

  // Branch location rules
  BRANCH_NAME_REQUIRED: "Tên chi nhánh không được để trống.",
  BRANCH_ADDRESS_REQUIRED: "Địa chỉ chi nhánh không được để trống.",
  BRANCH_LATITUDE_INVALID: "Vĩ độ chi nhánh phải là số từ -90 đến 90.",
  BRANCH_LONGITUDE_INVALID: "Kinh độ chi nhánh phải là số từ -180 đến 180.",
  BRANCH_RADIUS_INVALID: "Bán kính chi nhánh phải là số dương (> 0).",
} as const;
