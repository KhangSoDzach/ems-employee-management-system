import { useState, useEffect, useCallback } from "react"
import { Search, Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { format, startOfMonth, endOfMonth } from "date-fns"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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

// ─── Formatters ───────────────────────────────────────────────────────────────
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

type StatusKey = AttendanceRecord["status"]

function statusInfo(s: StatusKey): { label: string; cls: string } {
    const map: Record<string, { label: string; cls: string }> = {
        PRESENT: { label: "Đúng giờ", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        LATE: { label: "Đi muộn", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        ABSENT: { label: "Vắng mặt", cls: "bg-red-500/10 text-red-600 border-red-500/20" },
        HALF_DAY: { label: "Nửa ngày", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        ON_LEAVE: { label: "Nghỉ phép", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    }
    return map[s] ?? { label: s, cls: "bg-muted text-muted-foreground" }
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color, loading }: { label: string; value: string; sub: string; color: string; loading?: boolean }) {
    return (
        <Card className="border-border shadow-sm">
            <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">{label}</p>
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
    const navigate = useNavigate()

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
            const page_ = page
            const [histPage] = await Promise.all([
                attendanceService.getAttendance({
                    page: page_,
                    size: PAGE_SIZE,
                    startDate,
                    endDate,
                    status,
                }),
            ])
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
            <AppSidebar role="employee" variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => navigate("/checkin")}
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Chấm công
                                </button>
                                <span className="text-muted-foreground text-sm">/</span>
                                <span className="text-sm font-semibold text-foreground">Lịch sử điểm danh</span>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Lịch sử điểm danh</h2>
                            <p className="text-muted-foreground mt-1">Xem toàn bộ lịch sử chấm công của bạn</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Ngày đi làm"
                            value={summary ? `${summary.presentDays}` : "—"}
                            sub={`Tháng ${monthLabel}`}
                            color="text-emerald-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label="Ngày đi muộn"
                            value={summary ? `${summary.lateDays}` : "—"}
                            sub={`Tháng ${monthLabel}`}
                            color="text-amber-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label="Ngày vắng mặt"
                            value={summary ? `${summary.absentDays}` : "—"}
                            sub={`Tháng ${monthLabel}`}
                            color="text-red-600"
                            loading={summaryLoading}
                        />
                        <SummaryCard
                            label="Tổng giờ làm"
                            value={summary ? `${summary.totalWorkHours.toFixed(1)}h` : "—"}
                            sub={`Tháng ${monthLabel}`}
                            color="text-foreground"
                            loading={summaryLoading}
                        />
                    </div>

                    {/* Data Table */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Chi tiết chấm công
                                </CardTitle>

                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm ngày, trạng thái..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="pl-9 h-9 w-full sm:w-64 text-sm"
                                        />
                                    </div>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="h-9 w-full sm:w-44 text-sm">
                                            <SelectValue placeholder="Lọc trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="PRESENT">Đúng giờ</SelectItem>
                                            <SelectItem value="LATE">Đi muộn</SelectItem>
                                            <SelectItem value="ABSENT">Vắng mặt</SelectItem>
                                            <SelectItem value="HALF_DAY">Nửa ngày</SelectItem>
                                            <SelectItem value="ON_LEAVE">Nghỉ phép</SelectItem>
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
                                    <p className="text-sm font-medium">Không tìm thấy dữ liệu</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Ngày</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Giờ vào</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Giờ ra</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Tổng giờ</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Phương thức</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map(row => {
                                            const { label, cls } = statusInfo(row.status)
                                            return (
                                                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-border">
                                                    <TableCell className="px-6 py-4 font-medium text-foreground">{fmtDate(row.date)}</TableCell>
                                                    <TableCell className="px-6 py-4 text-primary font-medium">{fmtTime(row.checkInTime)}</TableCell>
                                                    <TableCell className="px-6 py-4 text-primary font-medium">{fmtTime(row.checkOutTime)}</TableCell>
                                                    <TableCell className="px-6 py-4 font-semibold text-foreground">{fmtWorkHours(row.workHours)}</TableCell>
                                                    <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                                                        {row.checkInMethod === "CAMERA_GEO" ? "Camera+GPS" : row.checkInMethod === "MANUAL" ? "Thủ công" : "—"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${cls}`}>
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
                                    Tổng {totalElements} bản ghi
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
