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

import { attendanceService, AttendanceRecord, AttendanceSummary } from "@/services/attendanceService"
import { CameraModal } from "./components/CameraModal"

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtTime(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

function fmtDate(iso: string | null) {
    if (!iso) return "—"
    return format(new Date(iso), "dd/MM/yyyy")
}

function fmtWorkHours(minutes: number | null) {
    if (minutes == null) return "—"
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m.toString().padStart(2, "0")}m`
}

function statusLabel(s: AttendanceRecord["status"]) {
    const map: Record<string, { label: string; cls: string }> = {
        PRESENT: { label: "Đúng giờ", cls: "bg-primary/10 text-primary" },
        LATE: { label: "Đi muộn", cls: "bg-destructive/10 text-destructive" },
        ABSENT: { label: "Vắng", cls: "bg-muted text-muted-foreground" },
        HALF_DAY: { label: "Nửa ngày", cls: "bg-accent text-accent-foreground" },
        ON_LEAVE: { label: "Nghỉ phép", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    }
    return map[s] ?? { label: s, cls: "bg-muted text-muted-foreground" }
}

type CheckStatus = "unchecked" | "checked_in" | "checked_out"

export default function CheckinPage() {
    const navigate = useNavigate()

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
                toast.success("Check-in thành công!")
            } else {
                const rec = await attendanceService.checkOut({
                    latitude: result.latitude,
                    longitude: result.longitude,
                    photoBase64: result.photoBase64,
                    locationLabel: result.locationLabel,
                })
                setTodayRecord(rec)
                toast.success("Check-out thành công!")
            }
            await fetchAll()
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra"
            toast.error(msg)
        } finally {
            setActionLoading(false)
            setPendingAction(null)
        }
    }

    // ── Summary stats ─────────────────────────────────────────────────────────
    const workHoursPct = summary ? Math.min(100, (summary.totalWorkHours / (summary.totalDays * 8)) * 100) : 0
    const latePct = summary && summary.totalDays > 0 ? (summary.lateDays / summary.totalDays) * 100 : 0

    return (
        <SidebarProvider>
            <AppSidebar role="employee" variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background dark:bg-background min-h-screen">
                    {/* Page header */}
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-2 mb-6">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cổng thông tin &gt; Chấm công</p>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-1">Điểm danh nhân viên</h2>
                            <p className="text-muted-foreground font-medium mt-1">Quản lý thời gian làm việc và lịch sử chấm công của bạn.</p>
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground bg-card px-5 py-2.5 rounded-xl border-border border shadow-sm capitalize">
                            {todayDisplay}
                        </div>
                    </div>

                    {/* Check-in Banner */}
                    <Card className="border-border shadow-sm bg-linear-to-br from-primary/5 to-background overflow-hidden relative">
                        <CardContent className="p-8 flex items-center justify-between">
                            <div className="z-10 flex flex-col items-start gap-4">
                                {status === "unchecked" && (
                                    <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 font-medium px-3 py-1">
                                        Chưa điểm danh
                                    </Badge>
                                )}
                                {status === "checked_in" && (
                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10 font-medium px-3 py-1">
                                        Đang làm việc (Vào lúc {fmtTime(todayRecord?.checkInTime ?? null)})
                                    </Badge>
                                )}
                                {status === "checked_out" && (
                                    <Badge variant="outline" className="text-muted-foreground border-border bg-muted font-medium px-3 py-1">
                                        Đã Check-out (Vào: {fmtTime(todayRecord?.checkInTime ?? null)} — Ra: {fmtTime(todayRecord?.checkOutTime ?? null)})
                                    </Badge>
                                )}

                                <h1 className="text-5xl font-extrabold text-foreground">{currentTime}</h1>

                                <p className="text-muted-foreground text-lg">
                                    {status === "unchecked" && "Chào buổi sáng! Hãy bắt đầu ngày làm việc đầy năng lượng."}
                                    {status === "checked_in" && "Bạn đang trong ca làm việc. Chúc một ngày làm việc hiệu quả!"}
                                    {status === "checked_out" && "Bạn đã kết thúc ca làm việc hôm nay. Nghỉ ngơi tốt nhé!"}
                                </p>

                                <div className="flex gap-4 mt-2">
                                    {(status === "unchecked" || status === "checked_out") && (
                                        <Button
                                            onClick={() => openCameraFor("checkIn")}
                                            disabled={loading || actionLoading}
                                            size="lg"
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-8 h-12 shadow-md flex items-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="fill-current w-5 h-5" />}
                                            Check In Ngay
                                        </Button>
                                    )}

                                    {status === "checked_in" && (
                                        <Button
                                            onClick={() => openCameraFor("checkOut")}
                                            disabled={actionLoading}
                                            size="lg"
                                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl px-8 h-12 shadow-md flex items-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="fill-current w-5 h-5" />}
                                            Check Out
                                        </Button>
                                    )}

                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate("/adjustment-requests")}
                                        className="bg-background hover:bg-muted text-foreground rounded-xl px-8 h-12 font-medium flex items-center gap-2"
                                    >
                                        <Coffee className="w-5 h-5 text-muted-foreground" />
                                        Điều chỉnh chấm công
                                    </Button>
                                </div>
                            </div>

                            {/* Right side — camera placeholder / captured photo */}
                            <div className="hidden md:block w-72 h-40 rounded-2xl overflow-hidden shadow-lg border-4 border-background z-10 bg-muted relative">
                                {todayRecord?.checkInPhotoUrl ? (
                                    <img
                                        src={`http://localhost:8080${todayRecord.checkInPhotoUrl}`}
                                        alt="Check-in photo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2662&auto=format&fit=crop')" }} />
                                )}
                            </div>

                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3" />
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Total work hours this month */}
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                        <CalendarClock className="w-6 h-6" />
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                                        Tháng này
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Tổng giờ làm</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.totalWorkHours.toFixed(1)}h` : "—"}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${workHoursPct}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Late days */}
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 text-xl font-bold">!</div>
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">Tháng này</Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Số ngày đi muộn</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.lateDays} ngày` : "—"}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${latePct}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendance rate */}
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 text-sm font-bold">
                                        %
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Tỷ lệ chuyên cần</p>
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                ) : (
                                    <div className="text-3xl font-bold text-foreground">{summary ? `${summary.attendancePercentage.toFixed(0)}%` : "—"}</div>
                                )}
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${summary?.attendancePercentage ?? 0}%` }} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* History Table */}
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-foreground">Lịch sử điểm danh (7 ngày gần nhất)</h3>
                                <Button variant="ghost" onClick={() => navigate("/attendance")} className="text-muted-foreground text-sm hover:text-foreground group">
                                    Xem tất cả <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                </Button>
                            </div>

                            <div className="w-full overflow-auto">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">Chưa có dữ liệu chấm công.</p>
                                ) : (
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-4 font-semibold tracking-wider">Ngày</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">Check-in</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">Check-out</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">Tổng giờ</th>
                                                <th className="px-4 py-4 font-semibold tracking-wider">Trạng thái</th>
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
                title={pendingAction === "checkIn" ? "Xác nhận Check-in" : "Xác nhận Check-out"}
                description="Chụp ảnh khuôn mặt và xác nhận vị trí của bạn để điểm danh."
                onCapture={handleCapture}
                onClose={() => { setCameraOpen(false); setPendingAction(null) }}
            />
        </SidebarProvider>
    )
}
