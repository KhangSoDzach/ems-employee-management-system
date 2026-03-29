// src/features/hr/run-payroll.constants.ts
// All display text for the HR "Quản lý kỳ lương / Chạy tính lương" page.

export const PAYROLL_HR_CONSTANTS = {
  // ── Page Header ────────────────────────────────────────────────────
  PAGE_TITLE: "Quản lý kỳ lương",
  PAGE_SUBTITLE:
    "Thực hiện tính toán lương, BHXH, BHYT cho nhân viên trong kỳ.",

  // ── RBAC ────────────────────────────────────────────────────────────
  ACCESS_DENIED_TITLE: "403 — Không có quyền truy cập",
  ACCESS_DENIED_DESC:
    "Trang này chỉ dành cho bộ phận Nhân sự (HR) hoặc Quản trị viên. Vui lòng liên hệ bộ phận IT nếu bạn cần quyền truy cập.",
} as const;
