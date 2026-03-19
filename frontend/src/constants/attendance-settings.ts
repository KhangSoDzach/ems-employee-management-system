// src/constants/attendance-settings.ts

export const ATTENDANCE_SETTINGS_CONSTANTS = {
  PAGE: {
    TITLE: "Cấu hình Quy tắc Chấm công",
    DESCRIPTION: "Thiết lập logic chấm công tự động cho toàn bộ hệ thống",
  },

  TABS: {
    TIME_RULES: "Cấu hình Thời gian",
    LOCATION_RULES: "Cấu hình Vị trí",
  },

  TIME_RULES: {
    SECTION_TITLE: "Quy tắc Thời gian",
    SECTION_DESC: "Thiết lập các ngưỡng thời gian cho việc chấm công tự động",

    SHIFT_1: {
      LABEL: "Ca 1",
      CHECK_IN: {
        LABEL: "Giờ vào ca 1",
        PLACEHOLDER: "08:00",
        DESCRIPTION: "Thời gian bắt đầu ca 1",
      },
      CHECK_OUT: {
        LABEL: "Giờ tan ca 1",
        PLACEHOLDER: "12:00",
        DESCRIPTION: "Thời gian kết thúc ca 1",
      },
    },

    SHIFT_2: {
      LABEL: "Ca 2",
      CHECK_IN: {
        LABEL: "Giờ vào ca 2",
        PLACEHOLDER: "13:30",
        DESCRIPTION: "Thời gian bắt đầu ca 2",
      },
      CHECK_OUT: {
        LABEL: "Giờ tan ca 2",
        PLACEHOLDER: "17:30",
        DESCRIPTION: "Thời gian kết thúc ca 2",
      },
    },

    GRACE_PERIOD: {
      LABEL: "Ngưỡng đi trễ",
      SUFFIX: "phút",
      PLACEHOLDER: "15",
      DESCRIPTION: "Số phút cho phép đi trễ trước khi bị đánh dấu muộn",
    },

    EARLY_LEAVE_THRESHOLD: {
      LABEL: "Ngưỡng về sớm",
      SUFFIX: "phút",
      PLACEHOLDER: "15",
      DESCRIPTION: "Số phút được phép về sớm trước giờ tan ca",
    },
  },

  LOCATION_RULES: {
    SECTION_TITLE: "Quy tắc Vị trí",
    SECTION_DESC: "Thiết lập các thông số GPS và kiểm tra vị trí khi chấm công",

    GPS_ENABLED: {
      LABEL: "Bật/Tắt GPS",
      DESCRIPTION: "Khi bật, hệ thống sẽ yêu cầu xác minh vị trí khi chấm công",
      ENABLED: "Đã bật",
      DISABLED: "Đã tắt",
    },

    COORDINATES: {
      LATITUDE: {
        LABEL: "Vĩ độ (Latitude)",
        PLACEHOLDER: "21.0285",
        DESCRIPTION: "Tọa độ vĩ độ của văn phòng",
      },
      LONGITUDE: {
        LABEL: "Kinh độ (Longitude)",
        PLACEHOLDER: "105.8542",
        DESCRIPTION: "Tọa độ kinh độ của văn phòng",
      },
    },

    RADIUS: {
      LABEL: "Bán kính hợp lệ",
      SUFFIX: "mét",
      PLACEHOLDER: "50",
      DESCRIPTION: "Bán kính cho phép check-in (tính từ tọa độ văn phòng)",
    },

    ACTION_ON_MISMATCH: {
      LABEL: "Khi sai vị trí",
      DESCRIPTION: "Hành động khi nhân viên check-in sai vị trí",
      BLOCK: "Chặn check-in",
      WARN: "Chỉ cảnh báo",
      NOTIFY: "Gửi thông báo về Admin",
    },
  },

  BUTTONS: {
    SAVE: "Lưu thay đổi",
    CANCEL: "Hủy",
    RESET: "Đặt lại mặc định",
  },

  TOAST: {
    SUCCESS_TITLE: "Cập nhật thành công",
    SUCCESS_DESC: "Cấu hình chấm công đã được lưu",
    ERROR_TITLE: "Cập nhật thất bại",
    ERROR_DESC: "Không thể lưu cấu hình. Vui lòng thử lại.",
    ERROR_FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
    LOADING: "Đang lưu cấu hình...",
  },

  VALIDATION: {
    REQUIRED_FIELD: "Trường này là bắt buộc",
    INVALID_TIME_FORMAT: "Định dạng giờ không hợp lệ (VD: 08:00)",
    MUST_BE_POSITIVE: "Giá trị phải lớn hơn 0",
    MUST_BE_NON_NEGATIVE: "Giá trị không được là số âm",
    INVALID_COORDINATE: "Tọa độ không hợp lệ",
    LATITUDE_RANGE: "Vĩ độ phải từ -90 đến 90",
    LONGITUDE_RANGE: "Kinh độ phải từ -180 đến 180",
    RADIUS_RANGE: "Bán kính phải từ 1 đến 10000 mét",
    DECIMAL_COORDINATE: "Tọa độ phải là số thập phân hợp lệ",
  },

  DEFAULTS: {
    SHIFT_1_CHECK_IN: "08:00",
    SHIFT_1_CHECK_OUT: "12:00",
    SHIFT_2_CHECK_IN: "13:30",
    SHIFT_2_CHECK_OUT: "17:30",
    GRACE_PERIOD: 15,
    EARLY_LEAVE_THRESHOLD: 15,
    RADIUS: 50,
    GPS_ENABLED: false,
    ACTION_ON_MISMATCH: "NOTIFY",
  },
} as const;

export const LOCATION_ACTION_OPTIONS = [
  {
    value: "BLOCK",
    label:
      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.ACTION_ON_MISMATCH.BLOCK,
  },
  {
    value: "NOTIFY",
    label:
      ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.ACTION_ON_MISMATCH.NOTIFY,
  },
  {
    value: "WARN",
    label: ATTENDANCE_SETTINGS_CONSTANTS.LOCATION_RULES.ACTION_ON_MISMATCH.WARN,
  },
] as const;

export type LocationActionValue =
  (typeof LOCATION_ACTION_OPTIONS)[number]["value"];

export const ATTENDANCE_SETTINGS_SCHEMA = {
  shift1CheckIn: {
    minLength: 1,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  shift1CheckOut: {
    minLength: 1,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  shift2CheckIn: {
    minLength: 1,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  shift2CheckOut: {
    minLength: 1,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  gracePeriod: {
    min: 0,
    max: 999,
  },
  earlyLeaveThreshold: {
    min: 0,
    max: 999,
  },
  latitude: {
    min: -90,
    max: 90,
  },
  longitude: {
    min: -180,
    max: 180,
  },
  radius: {
    min: 1,
    max: 10000,
  },
} as const;
