import { Play, Coffee, CalendarClock, Plane } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const TEXT = {
    breadcrumb: "Cổng thông tin > Chấm công",
    title: "Điểm danh nhân viên",
    subtitle: "Quản lý thời gian làm việc và lịch sử chấm công của bạn.",
    currentDate: "Thứ Ba, 24 Tháng 10, 2023",
    statusUnchecked: "Chưa điểm danh",
    currentTime: "08:30:45 AM",
    greeting: "Chào buổi sáng! Hãy bắt đầu ngày làm việc đầy năng lượng.",
    btnCheckIn: "Check In Ngay",
    btnReport: "Báo cáo sự cố",
    weeklyExtraHours: "+2.5h",
    weeklyHoursLabel: "Tổng giờ làm tuần này",
    weeklyHoursValue: "32.5h",
    lateAlertIcon: "!",
    lateAlertLabel: "Tháng này",
    lateDaysLabel: "Số ngày đi muộn",
    lateDaysValue: "1 ngày",
    leaveRemainingLabel: "Phép năm còn lại",
    leaveRemainingValue: "10 ngày",
    historyTitle: "Lịch sử điểm danh (7 ngày gần nhất)",
    viewAllPrompt: "Xem tất cả",
    colDate: "Ngày",
    colCheckIn: "Check-in",
    colCheckOut: "Check-out",
    colTotalHours: "Tổng giờ",
    colStatus: "Trạng thái",
    statusOnTime: "Đúng giờ",
    statusLate: "Đi muộn",
    statusEarly: "Về sớm",
}

const historyData = [
    {
        date: "23/10/2023",
        checkIn: "08:25 AM",
        checkOut: "05:30 PM",
        totalHours: "9h 05m",
        status: TEXT.statusOnTime,
        statusColor: "bg-primary/10 text-primary",
    },
    {
        date: "22/10/2023",
        checkIn: "08:45 AM",
        checkOut: "05:45 PM",
        totalHours: "9h 00m",
        status: TEXT.statusLate,
        statusColor: "bg-destructive/10 text-destructive",
    },
    {
        date: "21/10/2023",
        checkIn: "08:30 AM",
        checkOut: "05:30 PM",
        totalHours: "9h 00m",
        status: TEXT.statusOnTime,
        statusColor: "bg-primary/10 text-primary",
    },
    {
        date: "20/10/2023",
        checkIn: "08:15 AM",
        checkOut: "04:30 PM",
        totalHours: "8h 15m",
        status: TEXT.statusEarly,
        statusColor: "bg-accent text-accent-foreground",
    },
]

export default function CheckinPage() {
    return (
        <SidebarProvider>
            <AppSidebar role="employee" variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background dark:bg-background min-h-screen">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-2 mb-6">
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{TEXT.breadcrumb}</p>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground mt-1">{TEXT.title}</h2>
                            <p className="text-muted-foreground font-medium mt-1">
                                {TEXT.subtitle}
                            </p>
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground bg-card px-5 py-2.5 rounded-xl border-border border shadow-sm">
                            {TEXT.currentDate}
                        </div>
                    </div>

                    {/* Check-in Banner */}
                    <Card className="border-border shadow-sm bg-linear-to-br from-primary/5 to-background overflow-hidden relative">
                        <CardContent className="p-8 flex items-center justify-between">
                            <div className="z-10 flex flex-col items-start gap-4">
                                <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 font-medium px-3 py-1">
                                    {TEXT.statusUnchecked}
                                </Badge>
                                <h1 className="text-5xl font-extrabold text-foreground">{TEXT.currentTime}</h1>
                                <p className="text-muted-foreground text-lg">{TEXT.greeting}</p>

                                <div className="flex gap-4 mt-2">
                                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-8 h-12 shadow-md flex items-center gap-2">
                                        <Play className="fill-current w-5 h-5" />
                                        {TEXT.btnCheckIn}
                                    </Button>
                                    <Button size="lg" variant="outline" className="bg-background hover:bg-muted text-foreground rounded-xl px-8 h-12 font-medium flex items-center gap-2">
                                        <Coffee className="w-5 h-5 text-muted-foreground" />
                                        {TEXT.btnReport}
                                    </Button>
                                </div>
                            </div>

                            {/* Right side illustration/image placeholder */}
                            <div className="hidden md:block w-72 h-40 rounded-2xl overflow-hidden shadow-lg border-4 border-background z-10 bg-muted relative">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2662&auto=format&fit=crop')" }}></div>
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/40 flex items-center justify-center backdrop-blur-sm">
                                    <div className="w-6 h-6 rounded-full border-2 border-foreground/50 flex">
                                        <div className="w-px h-2.5 bg-foreground/50 ml-[10px] mt-0.5 origin-bottom rotate-45"></div>
                                        <div className="w-px h-3 bg-foreground/50 -ml-px mt-0.5"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Background decorations */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3"></div>
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                        <CalendarClock className="w-6 h-6" />
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">
                                        {TEXT.weeklyExtraHours}
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{TEXT.weeklyHoursLabel}</p>
                                <div className="text-3xl font-bold text-foreground">{TEXT.weeklyHoursValue}</div>
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div className="h-full bg-primary w-[65%] rounded-full"></div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                                        {TEXT.lateAlertIcon}
                                    </div>
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                                        {TEXT.lateAlertLabel}
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{TEXT.lateDaysLabel}</p>
                                <div className="text-3xl font-bold text-foreground">
                                    {TEXT.lateDaysValue}
                                </div>
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div className="h-full bg-destructive w-[10%] rounded-full"></div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mb-4">
                                        <Plane className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{TEXT.leaveRemainingLabel}</p>
                                <div className="text-3xl font-bold text-foreground">
                                    {TEXT.leaveRemainingValue}
                                </div>
                                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden flex">
                                    <div className="h-full bg-accent-foreground/50 w-[50%] rounded-full"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* History Table */}
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-foreground">{TEXT.historyTitle}</h3>
                                <Button variant="ghost" className="text-muted-foreground text-sm hover:text-foreground group">
                                    {TEXT.viewAllPrompt} <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                </Button>
                            </div>

                            <div className="w-full overflow-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase border-b border-border bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-4 py-4 font-semibold tracking-wider">{TEXT.colDate}</th>
                                            <th scope="col" className="px-4 py-4 font-semibold tracking-wider">{TEXT.colCheckIn}</th>
                                            <th scope="col" className="px-4 py-4 font-semibold tracking-wider">{TEXT.colCheckOut}</th>
                                            <th scope="col" className="px-4 py-4 font-semibold tracking-wider">{TEXT.colTotalHours}</th>
                                            <th scope="col" className="px-4 py-4 font-semibold tracking-wider">{TEXT.colStatus}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {historyData.map((row, i) => (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-5 font-medium text-foreground">{row.date}</td>
                                                <td className="px-4 py-5 text-primary font-medium">{row.checkIn}</td>
                                                <td className="px-4 py-5 text-primary font-medium">{row.checkOut}</td>
                                                <td className="px-4 py-5 font-semibold text-foreground">{row.totalHours}</td>
                                                <td className="px-4 py-5">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${row.statusColor}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
