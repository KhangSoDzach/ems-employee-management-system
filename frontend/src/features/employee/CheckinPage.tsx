import { Play, Square, Coffee, CalendarClock, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { format, subDays } from "date-fns"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffectiveRole } from "@/hooks/useEffectiveRole"

import { attendanceService, AttendanceRecord, AttendanceSummary } from "@/services/attendanceService"
import { CameraModal } from "./components/CameraModal"

import { SYSTEM_MESSAGES } from "@/constants/messages"
import { CHECKIN_STATUS } from "@/constants/options"

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function statusLabel(s: AttendanceRecord["status"]) {
    const map: Record<string, { label: string; cls: string }> = {
        PRESENT: { label: SYSTEM_MESSAGES.CHECKIN.STATUS_PRESENT, cls: "bg-primary/10 text-primary" },
        LATE: { label: SYSTEM_MESSAGES.CHECKIN.STATUS_LATE, cls: "bg-destructive/10 text-destructive" },
        ABSENT: { label: SYSTEM_MESSAGES.CHECKIN.STATUS_ABSENT, cls: "bg-muted text-muted-foreground" },
        HALF_DAY: { label: SYSTEM_MESSAGES.CHECKIN.STATUS_HALF, cls: "bg-accent text-accent-foreground" },
        ON_LEAVE: { label: SYSTEM_MESSAGES.CHECKIN.STATUS_ON_LEAVE, cls: CHECKIN_STATUS.ON_LEAVE.cls },
    }
    return map[s] ?? { label: s, cls: "bg-muted text-muted-foreground" }
}

type CheckStatus = "unchecked" | "checked_in" | "checked_out"

export default function CheckinPage() {
    const navigate = useNavigate()
    const effectiveRole = useEffectiveRole()

    // ── Live clock ────────────────────────────────────────────────────────────
    const [currentTime, setCurrentTime] = useState(() =>
        new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    )
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const todayDisplay = format(new Date(), "EEEE, dd 'Tháng' MM, yyyy")

    // ── Attendance state derived from today's record ──────────────────────────
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
    const [summary, setSummary] = useState<AttendanceSummary | null>(null)
    const [history, setHistory] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // ── Camera modal ──────────────────────────────────────────────────────────
    const [cameraOpen, setCameraOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<"checkIn" | "checkOut" | null>(null)

    // ── Derive status ─────────────────────────────────────────────────────────
    const status: CheckStatus = todayRecord == null
        ? "unchecked"
        : todayRecord.checkOutTime
            ? "checked_out"
            : "checked_in"

    // ── Fetch today's record + summary + recent history ───────────────────────
    const fetchAll = useCallback(async () => {
        try {
            const today = format(new Date(), "yyyy-MM-dd")
            const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd")

            const [historyPage, sum] = await Promise.all([
                attendanceService.getAttendance({ page: 0, size: 7, startDate: sevenDaysAgo, endDate: today }),
                attendanceService.getSummary(),
            ])

            const records = historyPage.content
            setSummary(sum)
            setHistory(records)

            // Today's record is the most recent one on today's date
            const todayRec = records.find(r => r.date === today) ?? null
            setTodayRecord(todayRec)
        } catch {
            // Silently fail - user may not have attendance records yet
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    // ── Open camera handler ───────────────────────────────────────────────────
    const openCameraFor = (action: "checkIn" | "checkOut") => {
        setPendingAction(action)
        setCameraOpen(true)
    }

    // ── Camera capture complete ───────────────────────────────────────────────
    const handleCapture = async (result: { photoBase64: string; latitude: number; longitude: number; locationLabel: string }) => {
        if (!pendingAction) return
        setActionLoading(true)
        try {
            if (pendingAction === "checkIn") {
                const rec = await attendanceService.checkIn({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    photoBase64: result.photoBase64,
                    locationLabel: result.locationLabel,
                    checkInMethod: "CAMERA_GEO",
                })
                setTodayRecord(rec)
                toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE)
            } else {
                const rec = await attendanceService.checkOut({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    photoBase64: result.photoBase64,
                    locationLabel: result.locationLabel,
                })
                setTodayRecord(rec)
                toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE)
            }
            await fetchAll()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : SYSTEM_MESSAGES.ERROR
            toast.error(msg)
        } finally {
            setActionLoading(false)
            setPendingAction(null)
        }
    }

    // ── Summary stats ─────────────────────────────────────────────────────────
    const workHoursPct = summary ? Math.min(100, (summary.totalWorkHours / (summary.totalDays * 8)) * 100) : 0
    const latePct = summary && summary.totalDays > 0 ? (summary.lateDays / summary.totalDays) * 100 : 0

    const getStatusBadge = () => {
        const checkInTime = fmtTime(todayRecord?.checkInTime ?? null)
        const checkOutTime = fmtTime(todayRecord?.checkOutTime ?? null)

        if (status === "unchecked") {
            return (
                <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 font-medium px-3 py-1">
                    {SYSTEM_MESSAGES.CHECKIN.STATUS_NOT_CHECKED}
                </Badge>
            )
        }
        if (status === "checked_in") {
            return (
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 font-medium px-3 py-1">
                    {SYSTEM_MESSAGES.CHECKIN.STATUS_WORKING(checkInTime)}
                </Badge>
            )
        }
        return (
            <Badge variant="outline" className="text-muted-foreground border-border bg-muted font-medium px-3 py-1">
                {SYSTEM_MESSAGES.CHECKIN.STATUS_CHECKED_OUT(checkInTime, checkOutTime)}
            </Badge>
        )
    }

    const getGreetingMessage = () => {
        if (status === "unchecked") return SYSTEM_MESSAGES.CHECKIN.MSG_MORNING
        if (status === "checked_in") return SYSTEM_MESSAGES.CHECKIN.MSG_WORKING
        return SYSTEM_MESSAGES.CHECKIN.MSG_DONE
    }

    return (
        <SidebarProvider>
            <AppSidebar role={effectiveRole} variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-wrapper">
                    {/* Page header */}
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-2 mb-6">
                        <div>
                            <p className="section-title text-muted-foreground uppercase tracking-wider mb-1">{SYSTEM_MESSAGES.CHECKIN.BREADCRUMB}</p>
                            <h2 className="page-heading mt-1">{SYSTEM_MESSAGES.CHECKIN.TITLE}</h2>
                            <p className="text-muted-foreground font-medium mt-1">{SYSTEM_MESSAGES.CHECKIN.DESC}</p>
                        </div>
                        <div className="btn-date capitalize">
                            {todayDisplay}
                        </div>
                    </div>

                    {/* Check-in Banner */}
                    <Card className="border-border shadow-sm bg-linear-to-br from-primary/5 to-background overflow-hidden relative">
                        <CardContent className="p-8 flex items-center justify-between">
                            <div className="z-10 flex flex-col items-start gap-4">
                                {getStatusBadge()}

                                <h1 className="text-5xl font-extrabold text-foreground">{currentTime}</h1>

                                <p className="text-muted-foreground text-lg">
                                    {getGreetingMessage()}
                                </p>

                                <div className="flex gap-4 mt-2">
                                    {status === "unchecked" && (
                                        <Button
                                            onClick={() => openCameraFor("checkIn")}
                                            disabled={loading || actionLoading}
                                            size="lg"
                                            className="btn-checkin"
                                        >
                                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="fill-current w-5 h-5" />}
                                            {SYSTEM_MESSAGES.CHECKIN.BTN_CHECKIN}
                                        </Button>
                                    )}

                                    {status === "checked_in" && (
                                        <Button
                                            onClick={() => openCameraFor("checkOut")}
                                            disabled={actionLoading}
                                            size="lg"
                                            className="btn-checkout"
                                        >
                                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="fill-current w-5 h-5" />}
                                            {SYSTEM_MESSAGES.CHECKIN.BTN_CHECKOUT}
                                        </Button>
                                    )}

                                    {status === "checked_out" && (
                                        <Button
                                            disabled
                                            size="lg"
                                            className="btn-checkin opacity-50 cursor-not-allowed"
                                        >
                                            <Square className="fill-current w-5 h-5 text-muted-foreground mr-2" />
                                            {SYSTEM_MESSAGES.CHECKIN.DONE_CHECKOUT}
                                        </Button>
                                    )}

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate("/adjustment-requests")}
                                        className="btn-cancel"
                                    >
                                        <Coffee className="w-5 h-5 text-muted-foreground" />
                                        {SYSTEM_MESSAGES.CHECKIN.BTN_ADJUST}
                                    </Button>
                                </div>
                            </div>

                            {/* Right side — camera placeholder / captured photo */}
                            {(() => {
                                const photoUrl =
                                    status === "checked_out"
                                        ? (todayRecord?.checkOutPhotoUrl ?? todayRecord?.checkInPhotoUrl)
                                        : todayRecord?.checkInPhotoUrl;
                                const photoAlt =
                                    status === "checked_out" ? "Check-out photo" : "Check-in photo";
                                return (
                                    <div className="hidden md:block shrink-0 w-48 h-48 rounded-2xl overflow-hidden shadow-lg border-4 border-background z-10 bg-muted relative">
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={photoAlt}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2662&auto=format&fit=crop')" }} />
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Total work hours this month */}
                        <Card className="card-border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="icon-box bg-primary/10 text-primary">
                                        <CalendarClock className="w-6 h-6" />
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                                        {SYSTEM_MESSAGES.CHECKIN.THIS_MONTH}
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.CHECKIN.WORK_HOURS}</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.totalWorkHours.toFixed(1)}h` : SYSTEM_MESSAGES.CHECKIN.NO_DATA_SHORT}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="progress-bar" style={{ width: `${workHoursPct}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Late days */}
                        <Card className="card-border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="icon-box bg-destructive/10 text-destructive text-xl font-bold">
                                        {SYSTEM_MESSAGES.SYMBOLS.EXCLAMATION}
                                    </div>
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">{SYSTEM_MESSAGES.CHECKIN.THIS_MONTH}</Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.CHECKIN.LATE_DAYS}</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.lateDays} ${SYSTEM_MESSAGES.COMMON.DAYS_UNIT}` : SYSTEM_MESSAGES.CHECKIN.NO_DATA_SHORT}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${latePct}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendance rate */}
                        <Card className="card-border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="icon-box bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold">
                                        {SYSTEM_MESSAGES.SYMBOLS.PERCENT}
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{SYSTEM_MESSAGES.CHECKIN.ATTENDANCE_RATE}</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.attendancePercentage.toFixed(0)}%` : SYSTEM_MESSAGES.CHECKIN.NO_DATA_SHORT}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="progress-bar" style={{ width: `${summary?.attendancePercentage ?? 0}%` }} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* History Table */}
                    <Card className="card-border">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-foreground">{SYSTEM_MESSAGES.CHECKIN.HISTORY_TITLE}</h3>
                                <Button variant="ghost" onClick={() => navigate("/attendance")} className="text-muted-foreground text-sm hover:text-foreground group">
                                    {SYSTEM_MESSAGES.CHECKIN.VIEW_ALL} <span className="ml-1 transition-transform group-hover:translate-x-1">{SYSTEM_MESSAGES.SYMBOLS.ARROW_RIGHT}</span>
                                </Button>
                            </div>

                            <div className="w-full overflow-auto">
                                {loading ? (
                                    <div className="loading-spinner justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">{SYSTEM_MESSAGES.CHECKIN.NO_DATA}</p>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-4 font-semibold tracking-wider">{SYSTEM_MESSAGES.CHECKIN.TABLE_DATE}</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">{SYSTEM_MESSAGES.CHECKIN.TABLE_CHECKIN}</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">{SYSTEM_MESSAGES.CHECKIN.TABLE_CHECKOUT}</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">{SYSTEM_MESSAGES.CHECKIN.TABLE_TOTAL_HOURS}</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">{SYSTEM_MESSAGES.CHECKIN.TABLE_STATUS}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {history.map((row) => {
                                                const { label, cls } = statusLabel(row.status)
                                                return (
                                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-5 font-medium text-foreground">{fmtDate(row.date)}</td>
                                                        <td className="px-4 py-5 text-primary font-medium">{fmtTime(row.checkInTime)}</td>
                                                        <td className="px-4 py-5 text-primary font-medium">{fmtTime(row.checkOutTime)}</td>
                                                        <td className="px-4 py-5 font-semibold text-foreground">{fmtWorkHours(row.workHours)}</td>
                                                        <td className="px-4 py-5">
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>

            {/* Camera Modal */}
            <CameraModal
                open={cameraOpen}
                title={pendingAction === "checkIn" ? SYSTEM_MESSAGES.CHECKIN.CONFIRM_IN : SYSTEM_MESSAGES.CHECKIN.CONFIRM_OUT}
                description={SYSTEM_MESSAGES.CHECKIN.CAMERA_DESC}
                onCapture={handleCapture}
                onClose={() => { setCameraOpen(false); setPendingAction(null) }}
            />
        </SidebarProvider>
    )
}
