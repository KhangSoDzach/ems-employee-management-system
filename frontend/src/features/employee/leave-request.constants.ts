import * as z from "zod"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, FileText, RotateCcw, Send, XCircle } from "lucide-react"

/* ══════════════ TYPES ══════════════ */

export type LeaveType = "annual" | "sick" | "unpaid" | "personal"
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED"

export interface AuditEntry {
    id: string
    action: "CREATED" | "APPROVED" | "REJECTED" | "RETURNED" | "EDITED"
    actor: string
    avatarUrl?: string
    timestamp: Date
    note?: string
}

export interface LeaveRequest {
    id: string
    dateCreated: Date
    startDate: Date
    endDate: Date
    type: LeaveType
    status: LeaveStatus
    reason: string
    auditTrail: AuditEntry[]
}

/* ══════════════ DATE FORMATS ══════════════ */

export const DATE_FORMAT = "dd/MM/yyyy"
export const DATETIME_FORMAT = "HH:mm, dd/MM/yyyy"
export const DATETIME_LOG_FORMAT = "HH:mm · dd/MM/yyyy"

/* ══════════════ USER INFO ══════════════ */

export const CURRENT_USER = {
    name: "Nguyễn Văn A",
    id: "EMP-001",
    department: "Phòng Kỹ thuật",
}

export const FORM_DEFAULTS = {}

/* ══════════════ CONSTANTS ══════════════ */

export const ALL_LABEL = "Tất cả"

/* ── THUỘC TÍNH LOẠI NGHỈ PHÉP ── */
export const LEAVE_TYPE_CONFIG: Record<LeaveType, { label: string; badgeClass: string }> = {
    annual: { label: "Nghỉ phép năm", badgeClass: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    sick: { label: "Nghỉ ốm", badgeClass: "text-rose-700 bg-rose-50 border-rose-200" },
    unpaid: { label: "Nghỉ không lương", badgeClass: "text-slate-700 bg-slate-50 border-slate-200" },
    personal: { label: "Việc riêng", badgeClass: "text-violet-700 bg-violet-50 border-violet-200" },
}

export const LEAVE_TYPE_OPTIONS = Object.entries(LEAVE_TYPE_CONFIG) as [LeaveType, typeof LEAVE_TYPE_CONFIG[LeaveType]][]

/* ── THUỘC TÍNH TRẠNG THÁI ── */
export const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; badgeClass: string; icon: LucideIcon }> = {
    PENDING: { label: "Chờ duyệt", badgeClass: "text-amber-700 bg-amber-50 border-amber-200", icon: RotateCcw },
    APPROVED: { label: "Đã duyệt", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    REJECTED: { label: "Từ chối", badgeClass: "text-rose-700 bg-rose-50 border-rose-200", icon: XCircle },
    RETURNED: { label: "Trả về", badgeClass: "text-orange-700 bg-orange-50 border-orange-200", icon: RotateCcw },
}

export const LEAVE_STATUS_OPTIONS = Object.entries(LEAVE_STATUS_CONFIG) as [LeaveStatus, typeof LEAVE_STATUS_CONFIG[LeaveStatus]][]

/* ── THUỘC TÍNH AUDIT ACTION ── */
export const AUDIT_ACTION_CONFIG = {
    CREATED: { label: "Tạo đơn", icon: Send, iconClass: "text-blue-500 bg-blue-50" },
    EDITED: { label: "Chỉnh sửa đơn", icon: FileText, iconClass: "text-amber-500 bg-amber-50" },
    APPROVED: { label: "Đã duyệt", icon: CheckCircle2, iconClass: "text-emerald-600 bg-emerald-50" },
    REJECTED: { label: "Từ chối", icon: XCircle, iconClass: "text-rose-600 bg-rose-50" },
    RETURNED: { label: "Trả về", icon: RotateCcw, iconClass: "text-orange-500 bg-orange-50" },
} as const

/* ══════════════ POLICY ══════════════ */
export const LEAVE_POLICY = {
    MIN_DAYS_BEFORE: 2,
    WEEKEND_DAYS: [0, 6], // Sunday, Saturday
}
/* ══════════════ SCHEMA & VALIDATION ══════════════ */

export const VALIDATION_MSGS = {
    DATE_REQ: "Vui lòng chọn ngày",
    TYPE_REQ: "Vui lòng chọn loại phép",
    REASON_REQ: "Vui lòng nhập lý do tối thiểu 5 ký tự",

    MIN_DAYS: `Phải đăng ký nghỉ trước ít nhất ${LEAVE_POLICY.MIN_DAYS_BEFORE} ngày`,
    NO_WEEKEND: "Không được chọn ngày nghỉ vào cuối tuần",
    START_BEFORE_END: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu",
}

export const leaveSchema = z
    .object({
        leaveType: z.enum(["annual", "sick", "unpaid", "personal"] as const, {
            error: VALIDATION_MSGS.TYPE_REQ,
        }),

        startDate: z
            .date({ error: VALIDATION_MSGS.DATE_REQ })
            .refine((date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const minDate = new Date(today)
                minDate.setDate(
                    minDate.getDate() + LEAVE_POLICY.MIN_DAYS_BEFORE
                )

                return date >= minDate
            }, {
                message: VALIDATION_MSGS.MIN_DAYS,
            })
            .refine((date) => {
                const day = date.getDay()
                return !LEAVE_POLICY.WEEKEND_DAYS.includes(day)
            }, {
                message: VALIDATION_MSGS.NO_WEEKEND,
            }),

        endDate: z
            .date({ error: VALIDATION_MSGS.DATE_REQ })
            .refine((date) => {
                const day = date.getDay()
                return !LEAVE_POLICY.WEEKEND_DAYS.includes(day)
            }, {
                message: VALIDATION_MSGS.NO_WEEKEND,
            }),

        reason: z.string().min(5, VALIDATION_MSGS.REASON_REQ),
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: VALIDATION_MSGS.START_BEFORE_END,
        path: ["endDate"],
    })
export type LeaveFormValues = z.infer<typeof leaveSchema>
/* ══════════════ MOCK DATA ══════════════ */

export const MOCK_DATA: LeaveRequest[] = [
    {
        id: "LV-008",
        dateCreated: new Date("2026-03-01T08:30:00"),
        startDate: new Date("2026-03-05T00:00:00"),
        endDate: new Date("2026-03-06T00:00:00"),
        type: "annual",
        status: "PENDING",
        reason: "Xin nghỉ phép đi du lịch gia đình",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: "Nguyễn Văn A", timestamp: new Date("2026-03-01T08:30:00") },
        ],
    },
    {
        id: "LV-007",
        dateCreated: new Date("2026-02-15T09:15:00"),
        startDate: new Date("2026-02-16T00:00:00"),
        endDate: new Date("2026-02-16T00:00:00"),
        type: "sick",
        status: "APPROVED",
        reason: "Sốt siêu vi, cần nghỉ ngơi",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: "Nguyễn Văn A", timestamp: new Date("2026-02-15T09:15:00") },
            { id: "a2", action: "APPROVED", actor: "Trần Trưởng Phòng", timestamp: new Date("2026-02-15T10:00:00"), note: "Chấp thuận. Giữ gìn sức khỏe." },
        ],
    },
    {
        id: "LV-006",
        dateCreated: new Date("2026-01-10T14:20:00"),
        startDate: new Date("2026-01-12T00:00:00"),
        endDate: new Date("2026-01-13T00:00:00"),
        type: "personal",
        status: "RETURNED",
        reason: "Giải quyết việc gia đình",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: "Nguyễn Văn A", timestamp: new Date("2026-01-10T14:20:00") },
            { id: "a2", action: "RETURNED", actor: "Trần Trưởng Phòng", timestamp: new Date("2026-01-10T15:30:00"), note: "Cần ghi rõ lý do việc gia đình là gì để duyệt." },
        ],
    },
]
