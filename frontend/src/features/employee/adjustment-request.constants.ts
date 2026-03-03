import * as z from "zod"
import { CheckCircle2, Clock, RotateCcw, Send, XCircle } from "lucide-react"

/* ══════════════ TYPES ══════════════ */

export type AdjustmentType = "CHECK_IN" | "CHECK_OUT" | "BOTH"
export type AdjustmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED"

export interface AuditEntry {
    id: string
    action: "CREATED" | "APPROVED" | "REJECTED" | "RETURNED" | "EDITED"
    actor: string
    avatarUrl?: string
    timestamp: Date
    note?: string
}

export interface AdjustmentRequest {
    id: string
    dateCreated: Date
    adjustmentDate: Date
    type: AdjustmentType
    proposedTimeIn?: string
    proposedTimeOut?: string
    originalTimeIn?: string
    originalTimeOut?: string
    status: AdjustmentStatus
    reason: string
    auditTrail: AuditEntry[]
}


/* ══════════════ DATE FORMATS ══════════════ */

export const DATE_FORMAT = "dd/MM/yyyy"
export const DATETIME_FORMAT = "HH:mm · dd/MM/yyyy"
export const DATETIME_LOG_FORMAT = "dd/MM/yyyy HH:mm"

/* ══════════════ USER PLACEHOLDER ══════════════ */

/** Replace with real auth context once backend is integrated */
export const CURRENT_USER = { name: "Nguyễn Văn An", initials: "NA" } as const

/* ══════════════ FORM DEFAULTS ══════════════ */

export const FORM_DEFAULTS = { timeIn: "09:00", timeOut: "18:00" } as const

/* ══════════════ FILTER LABELS ══════════════ */

export const ALL_LABEL = "Tất cả"

/* ══════════════ TYPE CONFIG ══════════════ */

export const ADJUSTMENT_TYPE_CONFIG: Record<
    AdjustmentType,
    { label: string; badgeClass: string; filterClass: string }
> = {
    CHECK_IN: { label: "Quên Check-in", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50", filterClass: "bg-indigo-100 text-indigo-700 border-indigo-300" },
    CHECK_OUT: { label: "Quên Check-out", badgeClass: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-50", filterClass: "bg-violet-100 text-violet-700 border-violet-300" },
    BOTH: { label: "Sửa cả hai", badgeClass: "bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-50", filterClass: "bg-teal-100   text-teal-700   border-teal-300" },
}

export const ADJUSTMENT_TYPE_OPTIONS = Object.entries(ADJUSTMENT_TYPE_CONFIG) as [
    AdjustmentType,
    (typeof ADJUSTMENT_TYPE_CONFIG)[AdjustmentType],
][]

/* ══════════════ STATUS CONFIG ══════════════ */

export const ADJUSTMENT_STATUS_CONFIG: Record<
    AdjustmentStatus,
    { label: string; badgeClass: string; filterClass: string }
> = {
    PENDING: { label: "Chờ duyệt", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100", filterClass: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    APPROVED: { label: "Đã duyệt", badgeClass: "bg-green-100  text-green-800  border-green-200  hover:bg-green-100", filterClass: "bg-green-100  text-green-800  border-green-300" },
    REJECTED: { label: "Từ chối", badgeClass: "bg-red-100    text-red-700    border-red-200    hover:bg-red-100", filterClass: "bg-red-100    text-red-700    border-red-300" },
    RETURNED: { label: "Trả về", badgeClass: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100", filterClass: "bg-orange-100 text-orange-700 border-orange-300" },
}

export const ADJUSTMENT_STATUS_OPTIONS = Object.entries(ADJUSTMENT_STATUS_CONFIG) as [
    AdjustmentStatus,
    (typeof ADJUSTMENT_STATUS_CONFIG)[AdjustmentStatus],
][]

/* ══════════════ AUDIT ACTION CONFIG ══════════════ */

export const AUDIT_ACTION_CONFIG: Record<
    AuditEntry["action"],
    { label: string; icon: typeof CheckCircle2; iconClass: string }
> = {
    CREATED: { label: "Tạo yêu cầu", icon: Send, iconClass: "text-blue-500   bg-blue-50" },
    APPROVED: { label: "Đã duyệt", icon: CheckCircle2, iconClass: "text-green-600  bg-green-50" },
    REJECTED: { label: "Từ chối", icon: XCircle, iconClass: "text-red-500    bg-red-50" },
    RETURNED: { label: "Trả về", icon: RotateCcw, iconClass: "text-orange-500 bg-orange-50" },
    EDITED: { label: "Chỉnh sửa", icon: Clock, iconClass: "text-violet-500 bg-violet-50" },
}

/* ══════════════ VALIDATION MESSAGES ══════════════ */

export const VALIDATION_MSGS = {
    dateRequired: "Vui lòng chọn ngày cần điều chỉnh",
    typeRequired: "Vui lòng chọn loại điều chỉnh",
    timeInRequired: "Vui lòng nhập thời gian Check-in đúng",
    timeOutRequired: "Vui lòng nhập thời gian Check-out đúng",
    reasonRequired: "Vui lòng nhập rõ lý do.",
} as const

/* ══════════════ ZOD SCHEMA ══════════════ */

export const adjustmentSchema = z.object({
    adjustmentDate: z.date({ message: VALIDATION_MSGS.dateRequired }),
    type: z.enum(["CHECK_IN", "CHECK_OUT", "BOTH"] as const, { message: VALIDATION_MSGS.typeRequired }),
    timeIn: z.string().optional(),
    timeOut: z.string().optional(),
    reason: z.string().min(1, VALIDATION_MSGS.reasonRequired),
}).refine(
    (d) => (d.type === "CHECK_IN" || d.type === "BOTH") ? !!d.timeIn : true,
    { message: VALIDATION_MSGS.timeInRequired, path: ["timeIn"] },
).refine(
    (d) => (d.type === "CHECK_OUT" || d.type === "BOTH") ? !!d.timeOut : true,
    { message: VALIDATION_MSGS.timeOutRequired, path: ["timeOut"] },
)

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

/* ══════════════ MOCK DATA ══════════════ */

export const MOCK_DATA: AdjustmentRequest[] = [
    {
        id: "ADJ-001",
        dateCreated: new Date(2023, 9, 24, 9, 12),
        adjustmentDate: new Date(2023, 9, 23),
        type: "BOTH",
        originalTimeIn: "09:30",
        originalTimeOut: "18:45",
        proposedTimeIn: "09:00",
        proposedTimeOut: "18:00",
        status: "PENDING",
        reason: "Máy chấm công bị lỗi vào buổi sáng, tôi đã báo bảo vệ nhưng hệ thống không ghi nhận.",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: CURRENT_USER.name, timestamp: new Date(2023, 9, 24, 9, 12) },
        ],
    },
    {
        id: "ADJ-002",
        dateCreated: new Date(2023, 9, 20, 8, 5),
        adjustmentDate: new Date(2023, 9, 19),
        type: "CHECK_IN",
        originalTimeIn: undefined,
        proposedTimeIn: "08:30",
        status: "APPROVED",
        reason: "Quên quẹt thẻ lúc vào, thang máy bị hỏng nên phải đi cầu thang bộ.",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: CURRENT_USER.name, timestamp: new Date(2023, 9, 20, 8, 5) },
            { id: "a2", action: "APPROVED", actor: "Trần Anh Tuấn (Manager)", timestamp: new Date(2023, 9, 21, 10, 30), note: "Đã xác nhận với bảo vệ." },
        ],
    },
    {
        id: "ADJ-003",
        dateCreated: new Date(2023, 9, 15, 17, 50),
        adjustmentDate: new Date(2023, 9, 14),
        type: "CHECK_OUT",
        originalTimeOut: undefined,
        proposedTimeOut: "17:00",
        status: "REJECTED",
        reason: "Ra về sớm nhưng quên chấm công ra.",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: CURRENT_USER.name, timestamp: new Date(2023, 9, 15, 17, 50) },
            { id: "a2", action: "REJECTED", actor: "Trần Anh Tuấn (Manager)", timestamp: new Date(2023, 9, 16, 9, 0), note: "Không có bằng chứng xác thực thời gian ra về." },
        ],
    },
    {
        id: "ADJ-004",
        dateCreated: new Date(2023, 9, 10, 11, 0),
        adjustmentDate: new Date(2023, 9, 9),
        type: "BOTH",
        originalTimeIn: "09:15",
        originalTimeOut: "18:30",
        proposedTimeIn: "09:00",
        proposedTimeOut: "18:00",
        status: "RETURNED",
        reason: "Hệ thống bị lỗi cả ngày.",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: CURRENT_USER.name, timestamp: new Date(2023, 9, 10, 11, 0) },
            { id: "a2", action: "RETURNED", actor: "Trần Anh Tuấn (Manager)", timestamp: new Date(2023, 9, 11, 14, 0), note: "Cần bổ sung thêm bằng chứng (ảnh chụp màn hình hệ thống lỗi)." },
        ],
    },
    {
        id: "ADJ-005",
        dateCreated: new Date(2023, 9, 5, 8, 30),
        adjustmentDate: new Date(2023, 9, 4),
        type: "BOTH",
        originalTimeIn: "08:05",
        originalTimeOut: "17:10",
        proposedTimeIn: "08:00",
        proposedTimeOut: "17:00",
        status: "APPROVED",
        reason: "Đầu đọc thẻ tại tầng 2 bị hỏng.",
        auditTrail: [
            { id: "a1", action: "CREATED", actor: CURRENT_USER.name, timestamp: new Date(2023, 9, 5, 8, 30) },
            { id: "a2", action: "APPROVED", actor: "Trần Anh Tuấn (Manager)", timestamp: new Date(2023, 9, 6, 9, 45) },
        ],
    },
]
