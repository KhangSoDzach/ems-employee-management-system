import { useState, useEffect, useCallback } from "react"
import { Search, Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffectiveRole } from "@/hooks/useEffectiveRole"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { attendanceService, AttendanceRecord, AttendanceSummary } from "@/services/attendanceService"

import { SYSTEM_MESSAGES } from "@/constants/messages"
import { ATTENDANCE_STATUS } from "@/constants/options"

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtTime(iso: string | null) {
    if (!iso) return SYSTEM_MESSAGES.COMMON.EMPTY_VALUE
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function fmtDate(iso: string | null) {
    if (!iso) return SYSTEM_MESSAGES.COMMON.EMPTY_VALUE
    return format(new Date(iso), "dd/MM/yyyy")
}

function fmtWorkHours(minutes: number | null) {
    if (minutes == null) return SYSTEM_MESSAGES.COMMON.EMPTY_VALUE
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT} ${m.toString().padStart(2, "0")}m`
}

function parseTimeToMinutes(iso: string | null) {
    if (!iso) return null

    const d = new Date(iso)
    if (isNaN(d.getTime())) return null

    return d.getHours() * 60 + d.getMinutes()
}

function checkinClass(iso: string | null) {
    const t = parseTimeToMinutes(iso)
    if (t == null) return "text-muted-foreground"
    return t > 8 * 60 ? "text-rose-600" : "text-emerald-600"
}

function checkoutClass(iso: string | null) {
    const t = parseTimeToMinutes(iso)
    if (t == null) return "text-muted-foreground"
    return t < 17 * 60 ? "text-rose-600" : "text-emerald-600"
}

function workHoursStatus(minutes: number | null) {
    if (minutes == null) {
        return {
            className: "text-muted-foreground",
            lines: [SYSTEM_MESSAGES.COMMON.EMPTY_VALUE],
        }
    }

    if (minutes < 8 * 60) {
        return {
            className: "text-rose-600",
            lines: [`${Math.floor(minutes / 60)}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT} ${(
                minutes % 60
            )
                .toString()
                .padStart(2, "0")}m`],
        }
    }

    const base = 8 * 60
    const overtime = minutes - base
    const overtimeHours = Math.floor(overtime / 60)
    const overtimeMinutes = overtime % 60

    const overtimeLabel = overtimeMinutes === 0 ? `${overtimeHours} ${SYSTEM_MESSAGES.COMMON.HOURS_UNIT}` : `${overtimeHours} ${SYSTEM_MESSAGES.COMMON.HOURS_UNIT} ${overtimeMinutes.toString().padStart(2, "0")}m`

    return {
        className: "text-emerald-600",
        lines:
            overtime === 0
                ? [`${Math.floor(minutes / 60)}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT}`]
                : [`8 ${SYSTEM_MESSAGES.COMMON.HOURS_UNIT}`, `+${overtimeLabel} over time`],
    }
}

type StatusKey = AttendanceRecord["status"]

function statusInfo(s: StatusKey): { label: string; cls: string } {
    const map: Record<string, { label: string; cls: string }> = {
        PRESENT: { label: ATTENDANCE_STATUS.PRESENT.label, cls: ATTENDANCE_STATUS.PRESENT.cls },
        LATE: { label: ATTENDANCE_STATUS.LATE.label, cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        ABSENT: { label: ATTENDANCE_STATUS.ABSENT.label, cls: ATTENDANCE_STATUS.ABSENT.cls },
        HALF_DAY: { label: ATTENDANCE_STATUS.HALF_DAY.label, cls: ATTENDANCE_STATUS.HALF_DAY.cls },
        ON_LEAVE: { label: ATTENDANCE_STATUS.ON_LEAVE.label, cls: ATTENDANCE_STATUS.ON_LEAVE.cls },
    }
    return map[s] ?? { label: s, cls: "bg-muted text-muted-foreground" }
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color, loading }: { label: string; value: string; sub: string; color: string; loading?: boolean }) {
    return (
        <Card className="card-border">
            <CardContent className="p-5">
                <p className="section-title-muted mb-1">{label}</p>
                {loading ? <Loader2 className="w-5 h-5 animate-spin my-1 text-muted-foreground" /> : (
                    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
        </Card>
    )
}

const PAGE_SIZE = 10

export default function AttendanceHistoryPage() {
    const effectiveRole = useEffectiveRole()

    // ── Filters ───────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [page, setPage] = useState(0)

    const now = new Date()
    const [startDate] = useState(format(startOfMonth(now), "yyyy-MM-dd"))
    const [endDate] = useState(format(endOfMonth(now), "yyyy-MM-dd"))

    // ── Data ──────────────────────────────────────────────────────────────────
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [summary, setSummary] = useState<AttendanceSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [summaryLoading, setSummaryLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const status = filterStatus === "all" ? undefined : filterStatus
            const histPage = await attendanceService.getAttendance({
                page,
                size: PAGE_SIZE,
                startDate,
                endDate,
                status,
            })
            setRecords(histPage.content)
            setTotalElements(histPage.totalElements)
            setTotalPages(histPage.totalPages)
        } catch {
            setRecords([])
        } finally {
            setLoading(false)
        }
    }, [page, filterStatus, startDate, endDate])

    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true)
        try {
            const sum = await attendanceService.getSummary({ startDate, endDate })
            setSummary(sum)
        } catch {
            setSummary(null)
        } finally {
            setSummaryLoading(false)
        }
    }, [startDate, endDate])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { fetchSummary() }, [fetchSummary])

    // Reset page on filter change
    useEffect(() => { setPage(0) }, [filterStatus])

    // ── Client-side search (on current page) ──────────────────────────────────
    const filtered = records.filter(r => {
        if (!search) return true
        const d = fmtDate(r.date).toLowerCase()
        const s = statusInfo(r.status).label.toLowerCase()
        const q = search.toLowerCase()
        return d.includes(q) || s.includes(q)
    })

    const monthLabel = format(now, "MM/yyyy")

    return (
        <SidebarProvider>
            <AppSidebar role={effectiveRole} variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-wrapper">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="page-heading">{SYSTEM_MESSAGES.ATTENDANCE_HIST.TITLE}</h1>
                            <p className="text-muted-foreground mt-1">{SYSTEM_MESSAGES.ATTENDANCE_HIST.DESC}</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <SummaryCard
                            label={SYSTEM_MESSAGES.ATTENDANCE.STATS_PRESENT}
                            value={summary ? String(summary.presentDays) : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                            sub={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_MONTH_LABEL(monthLabel)}
                            color="text-emerald-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label={SYSTEM_MESSAGES.ATTENDANCE.STATS_LATE}
                            value={summary ? String(summary.lateDays) : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                            sub={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_MONTH_LABEL(monthLabel)}
                            color="text-amber-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label={SYSTEM_MESSAGES.ATTENDANCE.STATS_ABSENT}
                            value={summary ? String(summary.absentDays) : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                            sub={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_MONTH_LABEL(monthLabel)}
                            color="text-red-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label={SYSTEM_MESSAGES.ATTENDANCE.STATS_WORK_HOURS}
                            value={summary ? `${summary.totalWorkHours.toFixed(1)}${SYSTEM_MESSAGES.COMMON.HOURS_UNIT}` : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                            sub={SYSTEM_MESSAGES.ATTENDANCE_HIST.CARD_MONTH_LABEL(monthLabel)}
                            color="text-foreground"
                            loading={summaryLoading}
                        />
                    </div>

                    {/* Data Table */}
                    <Card className="card-border">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    {SYSTEM_MESSAGES.ATTENDANCE_HIST.TABLE_TITLE}
                                </CardTitle>

                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder={SYSTEM_MESSAGES.SEARCH_PLACEHOLDER}
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="pl-9 h-9 w-full sm:w-64 text-sm"
                                        />
                                    </div>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="h-9 w-full sm:w-44 text-sm">
                                            <SelectValue placeholder={SYSTEM_MESSAGES.ATTENDANCE_HIST.FILTER_STATUS_PLACEHOLDER} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{SYSTEM_MESSAGES.LABEL_ALL}</SelectItem>
                                            <SelectItem value="PRESENT">{SYSTEM_MESSAGES.STATUS.PRESENT}</SelectItem>
                                            <SelectItem value="LATE">{SYSTEM_MESSAGES.STATUS.LATE}</SelectItem>
                                            <SelectItem value="ABSENT">{SYSTEM_MESSAGES.STATUS.ABSENT}</SelectItem>
                                            <SelectItem value="HALF_DAY">{SYSTEM_MESSAGES.STATUS.HALF_DAY}</SelectItem>
                                            <SelectItem value="ON_LEAVE">{SYSTEM_MESSAGES.STATUS.ON_LEAVE}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <Calendar className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="text-sm font-medium">{SYSTEM_MESSAGES.NO_DATA}</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_DATE}</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_CHECKIN}</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_CHECKOUT}</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_WORK_HOURS}</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_METHOD}</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">{SYSTEM_MESSAGES.ATTENDANCE.TABLE_STATUS}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map(row => {
                                            const { label, cls } = statusInfo(row.status)
                                            const checkInCls = checkinClass(row.checkInTime)
                                            const checkOutCls = checkoutClass(row.checkOutTime)
                                            const workStatus = workHoursStatus(row.workHours)

                                            return (
                                                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-border">
                                                    <TableCell className="px-6 py-4 font-medium text-foreground">{fmtDate(row.date)}</TableCell>
                                                    <TableCell className={`px-6 py-4 font-medium ${checkInCls}`}>{fmtTime(row.checkInTime)}</TableCell>
                                                    <TableCell className={`px-6 py-4 font-medium ${checkOutCls}`}>{fmtTime(row.checkOutTime)}</TableCell>
                                                    <TableCell className={`px-6 py-4 font-semibold ${workStatus.className}`}>
                                                        {workStatus.lines.map((line, index) => (
                                                            <div key={`${row.id}-work-${index}`} className={index === 0 ? "" : "text-xs text-muted-foreground"}>
                                                                {line}
                                                            </div>
                                                        ))}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                                                        {row.checkInMethod === "CAMERA_GEO" ? SYSTEM_MESSAGES.COMMON.METHOD_CAMERA_GPS : row.checkInMethod === "MANUAL" ? SYSTEM_MESSAGES.COMMON.METHOD_MANUAL : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className={`status-badge px-2.5 py-0.5 ${cls}`}>
                                                            {label}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Footer: count + pagination */}
                            <div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {SYSTEM_MESSAGES.ATTENDANCE_HIST.TOTAL_PREFIX} {totalElements} {SYSTEM_MESSAGES.ATTENDANCE_HIST.UNIT_RECORDS}
                                </span>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            disabled={page === 0}
                                            onClick={() => setPage(p => p - 1)}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span>{page + 1} / {totalPages}</span>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            disabled={page >= totalPages - 1}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
