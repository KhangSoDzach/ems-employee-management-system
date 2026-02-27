import { useState } from "react"
import { Search, Calendar, Clock, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ─── Mock Data ────────────────────────────────────────────────────────────────
const allHistory = [
    { date: "27/02/2024", checkIn: "08:02 AM", checkOut: "05:15 PM", totalHours: "9h 13m", status: "Đúng giờ", statusColor: "success" },
    { date: "26/02/2024", checkIn: "08:45 AM", checkOut: "05:30 PM", totalHours: "8h 45m", status: "Đi muộn", statusColor: "warning" },
    { date: "25/02/2024", checkIn: "07:55 AM", checkOut: "04:30 PM", totalHours: "8h 35m", status: "Đúng giờ", statusColor: "success" },
    { date: "24/02/2024", checkIn: "08:00 AM", checkOut: "05:00 PM", totalHours: "9h 00m", status: "Đúng giờ", statusColor: "success" },
    { date: "23/02/2024", checkIn: "—", checkOut: "—", totalHours: "—", status: "Vắng mặt", statusColor: "danger" },
    { date: "22/02/2024", checkIn: "08:10 AM", checkOut: "05:20 PM", totalHours: "9h 10m", status: "Đúng giờ", statusColor: "success" },
    { date: "21/02/2024", checkIn: "08:30 AM", checkOut: "04:45 PM", totalHours: "8h 15m", status: "Đi muộn", statusColor: "warning" },
    { date: "20/02/2024", checkIn: "07:50 AM", checkOut: "05:05 PM", totalHours: "9h 15m", status: "Đúng giờ", statusColor: "success" },
    { date: "19/02/2024", checkIn: "08:00 AM", checkOut: "06:00 PM", totalHours: "10h 00m", status: "Tăng ca", statusColor: "info" },
    { date: "18/02/2024", checkIn: "—", checkOut: "—", totalHours: "—", status: "Vắng mặt", statusColor: "danger" },
    { date: "17/02/2024", checkIn: "08:05 AM", checkOut: "05:10 PM", totalHours: "9h 05m", status: "Đúng giờ", statusColor: "success" },
    { date: "16/02/2024", checkIn: "09:00 AM", checkOut: "05:30 PM", totalHours: "8h 30m", status: "Đi muộn", statusColor: "warning" },
    { date: "15/02/2024", checkIn: "08:00 AM", checkOut: "07:00 PM", totalHours: "11h 00m", status: "Tăng ca", statusColor: "info" },
    { date: "14/02/2024", checkIn: "08:15 AM", checkOut: "05:00 PM", totalHours: "8h 45m", status: "Đúng giờ", statusColor: "success" },
    { date: "13/02/2024", checkIn: "08:00 AM", checkOut: "05:00 PM", totalHours: "9h 00m", status: "Đúng giờ", statusColor: "success" },
]

const statusBadgeMap: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

// ─── Summary Stats ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
    return (
        <Card className="border-border shadow-sm">
            <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">{label}</p>
                <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
        </Card>
    )
}

export default function AttendanceHistoryPage() {
    const navigate = useNavigate()
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")

    const filtered = allHistory.filter(row => {
        const matchStatus = filterStatus === "all" || row.status === filterStatus
        const matchSearch = row.date.includes(search) || row.status.includes(search)
        return matchStatus && matchSearch
    })

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
                        <SummaryCard label="Ngày đúng giờ" value="10" sub="Tháng này" color="text-emerald-600" />
                        <SummaryCard label="Ngày đi muộn" value="3" sub="Tháng này" color="text-amber-600" />
                        <SummaryCard label="Ngày vắng mặt" value="2" sub="Tháng này" color="text-red-600" />
                        <SummaryCard label="Tổng giờ làm" value="132h" sub="Tháng 2/2024" color="text-foreground" />
                    </div>

                    {/* Data Table */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Chi tiết chấm công
                                </CardTitle>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm ngày, trạng thái..."
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
                                            <SelectItem value="Đúng giờ">Đúng giờ</SelectItem>
                                            <SelectItem value="Đi muộn">Đi muộn</SelectItem>
                                            <SelectItem value="Vắng mặt">Vắng mặt</SelectItem>
                                            <SelectItem value="Tăng ca">Tăng ca</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Tabs defaultValue="month">
                                <div className="px-6 border-b border-border">
                                    <TabsList className="h-10 bg-transparent gap-4">
                                        <TabsTrigger value="month" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-sm font-medium">
                                            Tháng này
                                        </TabsTrigger>
                                        <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2 text-sm font-medium">
                                            Tất cả
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="month" className="m-0">
                                    <AttendanceTable rows={filtered} />
                                </TabsContent>
                                <TabsContent value="all" className="m-0">
                                    <AttendanceTable rows={filtered} />
                                </TabsContent>
                            </Tabs>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Hiển thị {filtered.length} / {allHistory.length} bản ghi
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

// ─── Table Component ──────────────────────────────────────────────────────────
function AttendanceTable({ rows }: { rows: typeof allHistory }) {
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Calendar className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Không tìm thấy dữ liệu</p>
            </div>
        )
    }
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Ngày</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Giờ vào</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Giờ ra</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Tổng giờ</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider px-6 py-4">Trạng thái</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/30 transition-colors border-border">
                        <TableCell className="px-6 py-4 font-medium text-foreground">{row.date}</TableCell>
                        <TableCell className="px-6 py-4 text-primary font-medium">{row.checkIn}</TableCell>
                        <TableCell className="px-6 py-4 text-primary font-medium">{row.checkOut}</TableCell>
                        <TableCell className="px-6 py-4 font-semibold text-foreground">{row.totalHours}</TableCell>
                        <TableCell className="px-6 py-4">
                            <Badge
                                variant="outline"
                                className={`text-xs font-semibold px-2.5 py-0.5 ${statusBadgeMap[row.statusColor]}`}
                            >
                                {row.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
