// src/features/admin/salary-policy.constants.ts
// All display text for the Admin "Cấu hình chính sách lương" page.

export const PAYROLL_ADMIN_CONSTANTS = {
  // ── Page Header ────────────────────────────────────────────────────
  PAGE_TITLE: "Cấu hình chính sách lương",
  PAGE_SUBTITLE:
    "Quản lý danh sách thành phần lương để phục vụ hệ thống tính lương.",

  // ── Buttons ────────────────────────────────────────────────────────
  BTN_CREATE: "Tạo mới",

  // ── Search ─────────────────────────────────────────────────────────
  SEARCH_PLACEHOLDER: "Tìm kiếm mã hoặc tên...",

  // ── Table Columns ──────────────────────────────────────────────────
  COL_CODE: "Mã",
  COL_NAME: "Tên",
  COL_TYPE: "Loại",
  COL_TAXABLE: "Chịu thuế",
  COL_INSURABLE: "Đóng BHXH",
  COL_NATURE: "Tính chất",
  COL_AMOUNT: "Số tiền",
  COL_RATE: "Hệ số (%)",
  COL_STATUS: "Trạng thái",
  COL_ACTIONS: "Hành động",

  // ── Table Data Labels ──────────────────────────────────────────────
  YES: "Có",
  NO: "Không",
  EMPTY_VALUE: "-",

  // ── Table Body States ──────────────────────────────────────────────
  LOADING: "Đang tải dữ liệu...",
  EMPTY_SEARCH: "Không tìm thấy kết quả phù hợp.",
  EMPTY_DATA: "Chưa có thành phần lương nào.",

  // ── Pagination ─────────────────────────────────────────────────────
  PAGINATION_TOTAL: (n: number) => `Tổng cộng ${n} kết quả. Trang`,
  PAGINATION_PREV: "Trước",
  PAGINATION_NEXT: "Sau",

  // ── Toast Messages ─────────────────────────────────────────────────
  TOAST_CREATE_SUCCESS: "Tạo thành phần lương thành công",
  TOAST_UPDATE_SUCCESS: "Cập nhật thành phần lương thành công",
  ERROR_FALLBACK: "Không thể xử lý yêu cầu. Vui lòng thử lại.",

  // ── RBAC ────────────────────────────────────────────────────────────
  ACCESS_DENIED_TITLE: "403 — Không có quyền truy cập",
  ACCESS_DENIED_DESC:
    "Trang này chỉ dành cho quản trị viên (Admin). Vui lòng liên hệ bộ phận IT nếu bạn cần quyền truy cập.",

  // ── Component Labels ───────────────────────────────────────────────
  TYPE_LABELS: {
    BASE: "Lương cơ bản",
    ALLOWANCE: "Phụ cấp",
    COMMISSION: "Hoa hồng",
    BONUS: "Thưởng",
    DEDUCTION: "Khấu trừ",
    INSURANCE: "Bảo hiểm",
  } as Record<string, string>,

  NATURE_LABELS: {
    INCOME: "Thu nhập",
    DEDUCTION: "Khấu trừ",
  } as Record<string, string>,

  STATUS_LABELS: {
    ACTIVE: "Đang áp dụng",
    INACTIVE: "Ngừng áp dụng",
  } as Record<string, string>,
} as const;
