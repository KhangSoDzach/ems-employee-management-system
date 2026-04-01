import {
  CheckCircle2,
  FileText,
  RotateCcw,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/* ══════════════ TYPES ══════════════ */

export type LeaveType = "annual" | "sick" | "unpaid" | "personal";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";

export interface AuditEntry {
  id: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "RETURNED" | "EDITED";
  actor: string;
  avatarUrl?: string;
  timestamp: Date;
  note?: string;
}

export interface LeaveRequest {
  id: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  dateCreated: Date;
  startDate: Date;
  endDate: Date;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  auditTrail: AuditEntry[];
}

/* ══════════════ DATE FORMATS ══════════════ */

export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "HH:mm, dd/MM/yyyy";
export const DATETIME_LOG_FORMAT = "HH:mm · dd/MM/yyyy";

/* ══════════════ USER INFO ══════════════ */

export const CURRENT_USER = {
  name: "Nguyễn Văn A",
  id: "EMP-001",
  department: "Phòng Kỹ thuật",
};

export const FORM_DEFAULTS = {};

/* ══════════════ CONSTANTS ══════════════ */

export const ALL_LABEL = "Tất cả";

/* ── THUỘC TÍNH LOẠI NGHỈ PHÉP ── */
export const LEAVE_TYPE_CONFIG: Record<
  LeaveType,
  { label: string; badgeClass: string; filterClass: string; dotClass: string }
> = {
  annual: {
    label: "Nghỉ phép năm",
    badgeClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
    filterClass: "bg-indigo-100 text-indigo-700 border-indigo-300",
    dotClass: "bg-indigo-500",
  },
  sick: {
    label: "Nghỉ ốm",
    badgeClass: "text-rose-700 bg-rose-50 border-rose-200",
    filterClass: "bg-rose-100 text-rose-700 border-rose-300",
    dotClass: "bg-rose-500",
  },
  unpaid: {
    label: "Nghỉ không lương",
    badgeClass: "text-slate-700 bg-slate-50 border-slate-200",
    filterClass: "bg-slate-200 text-slate-700 border-slate-300",
    dotClass: "bg-slate-500",
  },
  personal: {
    label: "Việc riêng",
    badgeClass: "text-violet-700 bg-violet-50 border-violet-200",
    filterClass: "bg-violet-100 text-violet-700 border-violet-300",
    dotClass: "bg-violet-500",
  },
};

export const LEAVE_TYPE_OPTIONS = Object.entries(LEAVE_TYPE_CONFIG) as [
  LeaveType,
  (typeof LEAVE_TYPE_CONFIG)[LeaveType],
][];

/* ── THUỘC TÍNH TRẠNG THÁI ── */
export const LEAVE_STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; badgeClass: string; icon: LucideIcon; filterClass: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    badgeClass: "text-amber-700 bg-amber-50 border-amber-200",
    icon: RotateCcw,
    filterClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  APPROVED: {
    label: "Đã duyệt",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    filterClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  REJECTED: {
    label: "Từ chối",
    badgeClass: "text-rose-700 bg-rose-50 border-rose-200",
    icon: XCircle,
    filterClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
  RETURNED: {
    label: "Trả về",
    badgeClass: "text-orange-700 bg-orange-50 border-orange-200",
    icon: RotateCcw,
    filterClass: "bg-orange-100 text-orange-800 border-orange-300",
  },
};

export const LEAVE_STATUS_OPTIONS = Object.entries(LEAVE_STATUS_CONFIG) as [
  LeaveStatus,
  (typeof LEAVE_STATUS_CONFIG)[LeaveStatus],
][];

/* ── THUỘC TÍNH AUDIT ACTION ── */
export const AUDIT_ACTION_CONFIG = {
  CREATED: {
    label: "Tạo đơn",
    icon: Send,
    iconClass: "text-blue-500 bg-blue-50",
  },
  EDITED: {
    label: "Chỉnh sửa đơn",
    icon: FileText,
    iconClass: "text-amber-500 bg-amber-50",
  },
  APPROVED: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 bg-emerald-50",
  },
  REJECTED: {
    label: "Từ chối",
    icon: XCircle,
    iconClass: "text-rose-600 bg-rose-50",
  },
  RETURNED: {
    label: "Trả về",
    icon: RotateCcw,
    iconClass: "text-orange-500 bg-orange-50",
  },
} as const;

/* ══════════════ POLICY ══════════════ */
export const LEAVE_POLICY = {
  MIN_DAYS_BEFORE: 2,
  WEEKEND_DAYS: [0, 6], // Sunday, Saturday
};
/* ══════════════ SCHEMA & VALIDATION ══════════════ */

export const VALIDATION_MSGS = {
  DATE_REQ: "Vui lòng chọn ngày",
  TYPE_REQ: "Vui lòng chọn loại phép",
  REASON_REQ: "Vui lòng nhập lý do tối thiểu 5 ký tự",

  MIN_DAYS: `Phải đăng ký nghỉ trước ít nhất ${LEAVE_POLICY.MIN_DAYS_BEFORE} ngày`,
  NO_WEEKEND: "Không được chọn ngày nghỉ vào cuối tuần",
  START_BEFORE_END: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
};

export const MOCK_DATA: LeaveRequest[] = [];
