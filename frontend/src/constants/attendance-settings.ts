// src/constants/attendance-settings.ts

export const ATTENDANCE_SETTINGS_CONSTANTS = {
  PAGE: {
    TITLE: "Cấu hình chấm công",
    DESCRIPTION:
      "Thiết lập các quy tắc về thời gian, địa điểm và phương thức xác thực để tối ưu hóa quy trình quản lý nhân sự của doanh nghiệp bạn.",
    SYSTEM_CONFIG: "Hệ thống",
    SECURITY_HIGH: "Bảo mật: Cao",
    CONFIG_ACTIVE: "Cấu hình: Hoạt động",
  },

  TABS: {
    TIME_RULES: "Cấu hình Thời gian",
    LOCATION_RULES: "Cấu hình Vị trí",
  },

  TIME_RULES: {
    SECTION_TITLE: "Quy tắc thời gian",
    SECTION_DESC: "Quản lý ca làm việc và thời gian linh hoạt",
    SHIFT_01: "01",
    SHIFT_02: "02",

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
      LABEL: "Thời gian đi muộn cho phép",
      SUFFIX: "phút",
      PLACEHOLDER: "15",
      DESCRIPTION: "Số phút tối đa được phép đi muộn",
    },

    EARLY_LEAVE_THRESHOLD: {
      LABEL: "Thời gian về sớm cho phép",
      SUFFIX: "phút",
      PLACEHOLDER: "15",
      DESCRIPTION: "Số phút được phép về sớm mà không bị tính là vi phạm",
    },

    GRACE_PERIODS_SUBTITLE: "Độ trễ & Sớm cho phép",
    GRACE_PERIODS_DESC: "Thiết lập ngưỡng sai số thời gian cho phép",
    PROCESS_TITLE: "Quy trình áp dụng",
    PROCESS_DESC:
      "Mọi thay đổi sẽ có hiệu lực ngay lập tức cho các lượt chấm công mới từ phiên làm việc kế tiếp của nhân viên.",
  },

  LOCATION_RULES: {
    SECTION_TITLE: "Quy tắc Vị trí",
    SECTION_DESC: "Thiết lập các thông số GPS và kiểm tra vị trí khi chấm công",

    BRANCH_LOCATIONS: {
      SECTION_TITLE: "Vị trí check-in theo chi nhánh",
      SECTION_DESC:
        "Quản lý nhiều chi nhánh để gán vị trí check-in theo từng bộ phận/chức danh",
      BRANCH_NAME_LABEL: "Tên chi nhánh",
      BRANCH_NAME_PLACEHOLDER: "Ví dụ: Chi nhánh Hà Nội",
      BRANCH_ADDRESS_LABEL: "Địa chỉ",
      BRANCH_ADDRESS_PLACEHOLDER: "Ví dụ: 123 Trần Duy Hưng, Cầu Giấy, Hà Nội",
      LATITUDE_LABEL: "Vĩ độ",
      LONGITUDE_LABEL: "Kinh độ",
      RADIUS_LABEL: "Bán kính (m)",
      ACTIVE_LABEL: "Kích hoạt",
      ADD_BUTTON: "Thêm chi nhánh",
      DELETE_BUTTON: "Xóa",
      EMPTY_MESSAGE: "Chưa có chi nhánh nào. Hãy thêm chi nhánh đầu tiên.",
      COORDINATE_PREFIX: "Tọa độ",
      RADIUS_PREFIX: "Bán kính",
      ADDRESS_FALLBACK: "Chưa cập nhật địa chỉ",
      ACTIVE_STATUS: "Hoạt động",
      INACTIVE_STATUS: "Tạm dừng",
    },

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

    VALIDATION_TITLE: "Cấu hình xác thực",
    VALIDATION_DESC: "Thiết lập phạm vi & hành động",
  },

  BUTTONS: {
    SAVE: "Lưu thay đổi",
    CANCEL: "Hủy",
    RESET: "Đặt lại mặc định",
    CONFIRM_TIME: "Xác nhận thời gian",
    CONFIRM_LOCATION: "Xác nhận vị trí",
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
    SHIFT_END_BEFORE_START: "Giờ tan ca phải sau giờ vào ca",
    SHIFT_OVERLAP: "Thời gian các ca không được chồng lấn (Ca 2 phải sau Ca 1)",
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
    BRANCH_RADIUS: 100,
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
