export const PAYROLL_ADMIN_CONSTANTS = {
  TITLE: "Cấu hình chính sách lương",
  SUBTITLE:
    "Quản lý danh sách thành phần lương để phục vụ hệ thống tính lương.",
  BTN_CREATE: "Tạo mới",
  SEARCH_PLACEHOLDER: "Tìm kiếm mã hoặc tên...",
  TABLE: {
    CODE: "Mã",
    NAME: "Tên",
    TYPE: "Loại",
    TAXABLE: "Chịu thuế",
    INSURABLE: "Đóng BHXH",
    NATURE: "Tính chất",
    AMOUNT: "Số tiền",
    RATE: "Hệ số (%)",
    STATUS: "Trạng thái",
    ACTIONS: "Hành động",
  },
  MESSAGES: {
    CREATE_SUCCESS: "Tạo thành phần lương thành công",
    UPDATE_SUCCESS: "Cập nhật thành phần lương thành công",
    EMPTY: "Chưa có thành phần lương nào.",
    NOT_FOUND: "Không tìm thấy kết quả phù hợp.",
    LOADING: "Đang tải dữ liệu...",
  },
};

export const PAYROLL_HR_CONSTANTS = {
  TITLE: "Quản lý kỳ lương",
  SUBTITLE: "Thực hiện tính toán lương, BHXH, BHYT cho nhân viên trong kỳ.",
  LABEL_PERIOD: "Kỳ lương",
  BTN_RUN: "Run Payroll",
  BTN_RECALCULATE: "Tính lại",
  DESC_RUN:
    "Tự động tính BHXH, BHYT, BHTN và lương net cho toàn bộ nhân viên trong kỳ lương được chọn.",
  MESSAGES: {
    RUN_SUCCESS: (period: string) => `Tính lương kỳ ${period} thành công`,
    RECALC_SUCCESS: (period: string) =>
      `Tính lại lương kỳ ${period} thành công`,
    RUNNING: "Đang tính lương…",
    RECALCULATING: "Đang tính lại…",
  },
};
