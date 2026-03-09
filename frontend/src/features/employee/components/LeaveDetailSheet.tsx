import { format } from "date-fns"
import { CalendarIcon, MessageSquare, User } from "lucide-react"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

import {
    AuditEntry,
    AUDIT_ACTION_CONFIG,
    CURRENT_USER,
    DATE_FORMAT,
    DATETIME_FORMAT,
    DATETIME_LOG_FORMAT,
    LeaveRequest,
} from "../leave-request.constants"
import { StatusBadge } from "./LeaveBadges"
import { SYSTEM_MESSAGES } from "@/constants/messages"

/* ══════════════ SHEET LABELS ══════════════ */

const SHEET_LABELS = {
    INFO_GROUP: "Thông tin chung",
    LEAVE_GROUP: "Chi tiết nghỉ phép",
    REASON_GROUP: "Lý do chi tiết",
    TIMELINE_GROUP: "Lịch sử hoạt động",
} as const

/* ══════════════ AUDIT TIMELINE COMPONENT ══════════════ */

const AuditTimeline = ({ entries }: { entries: AuditEntry[] }) => {
    // Sort descending by timestamp
    const sorted = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return (
        <div className="relative pl-4 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-border/60">
            {sorted.map((entry) => {
                const config = AUDIT_ACTION_CONFIG[entry.action]
                const Icon = config.icon

                return (
                    <div key={entry.id} className="relative">
                        {/* Timeline Icon Node */}
                        <div
                            className={`absolute -left-7 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-background ${config.iconClass}`}
                        >
                            <Icon className="w-3 h-3 block m-auto" />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-1.5 ml-3">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-semibold text-foreground">
                                    {config.label}
                                </span>
                                <time className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {format(entry.timestamp, DATETIME_LOG_FORMAT)}
                                </time>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                                    {entry.avatarUrl ? (
                                        <img src={entry.avatarUrl} alt={entry.actor} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3 h-3 text-muted-foreground" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">
                                    {entry.actor}
                                </span>
                            </div>

                            {entry.note && (
                                <div className="mt-2 text-sm text-foreground bg-muted/40 border rounded-lg px-3 py-2.5 leading-relaxed">
                                    {entry.note}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ══════════════ DETAIL SHEET COMPONENT ══════════════ */

interface DetailSheetProps {
    request: LeaveRequest | null
    open: boolean
    onClose: () => void
}

export const LeaveDetailSheet = ({ request, open, onClose }: DetailSheetProps) => {
    if (!request) return null

    const daysCount =
        Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl">

                {/* ── Header ── */}
                <div className="px-6 py-5 border-b bg-muted/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative">
                        <SheetHeader className="text-left space-y-1">

                            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                {SYSTEM_MESSAGES.LEAVE.SHEET_TITLE}
                            </SheetTitle>
                            <div className="flex items-center justify-between ">
                                <Badge variant="secondary" className="font-mono px-2 py-0.5 text-xs bg-background shadow-sm border">
                                    {request.id}
                                </Badge>
                                <StatusBadge status={request.status} />
                            </div>
                            <SheetDescription className="text-sm font-medium text-muted-foreground">
                                {SYSTEM_MESSAGES.LABEL_CREATED_AT} {format(request.dateCreated, DATETIME_FORMAT)}
                            </SheetDescription>

                        </SheetHeader>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">

                        {/* ── Employee Info ── */}
                        <section className="space-y-4">
                            <h4 className="section-title-muted flex items-center gap-2">
                                <User className="w-3.5 h-3.5" />
                                {SHEET_LABELS.INFO_GROUP}
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-muted/20 p-4 rounded-xl border border-border/50">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.LABEL_EMPLOYEE}</p>
                                    <p className="text-sm font-semibold">{CURRENT_USER.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.PROFILE.EMP_CODE}</p>
                                    <p className="text-sm font-semibold">{CURRENT_USER.id}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.LABEL_DEPARTMENT}</p>
                                    <p className="text-sm font-semibold">{CURRENT_USER.department}</p>
                                </div>

                            </div>

                        </section>

                        {/* ── Leave Info ── */}
                        <section className="space-y-4">
                            <h4 className="section-title-muted flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {SHEET_LABELS.LEAVE_GROUP}
                            </h4>
                            <div className="rounded-xl border shadow-sm overflow-hidden">
                                <div className="grid grid-cols-2 divide-x border-b bg-muted/20">
                                    <div className="p-4">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.PROFILE.START_DATE}</p>
                                        <p className="text-sm font-semibold">{format(request.startDate, DATE_FORMAT)}</p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.LEAVE.SHEET_END_DATE}</p>
                                        <p className="text-sm font-semibold">{format(request.endDate, DATE_FORMAT)}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-background flex justify-between items-center ">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.LEAVE.SHEET_TOTAL_TIME}</p>
                                        <p className="text-sm font-bold text-primary">{daysCount} {SYSTEM_MESSAGES.LEAVE.DAYS}</p>
                                    </div>

                                </div>

                            </div>
                        </section>

                        {/* ── Reason ── */}
                        <section className="space-y-3">
                            <h4 className="section-title-muted flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" />
                                {SHEET_LABELS.REASON_GROUP}
                            </h4>
                            <div className="p-4 bg-muted/30 border rounded-xl shadow-sm">
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {request.reason}
                                </p>
                            </div>
                        </section>

                        {/* ── Timeline ── */}
                        <section className="space-y-5 pt-2 border-t">
                            <h4 className="section-title-muted">
                                {SHEET_LABELS.TIMELINE_GROUP}
                            </h4>
                            <AuditTimeline entries={request.auditTrail} />
                        </section>

                    </div>
                </div>

            </SheetContent>
        </Sheet>
    )
}
