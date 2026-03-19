import { useMemo, useState } from "react"
import { Search, Filter, Plus, Pencil, Eye, ChevronLeft, ChevronRight, BarChart2, AlertTriangle, Loader2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { AddKpiOkrModal } from "./components/AddKpiOkrModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table"

interface KpiItem {
  id: number; name: string; description?: string
  type: "KPI" | "OKR"; metricType: "PERCENT" | "VND" | "NUMBER"
  targetValue: number; actualValue: number; progress: number
  weight: number; scopeType: string; status: string
  periodStart: string; periodEnd: string
}

const mockData: KpiItem[] = [
  {
    id: 1,
    name: "Doanh thu quý 1",
    description: "Tăng trưởng doanh thu theo kế hoạch",
    type: "KPI",
    metricType: "VND",
    targetValue: 500000000,
    actualValue: 420000000,
    progress: 84,
    weight: 30,
    scopeType: "TEAM",
    status: "ACTIVE",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
  },
  {
    id: 2,
    name: "Tỷ lệ hoàn thành OKR",
    description: "Đảm bảo tiến độ OKR toàn team",
    type: "OKR",
    metricType: "PERCENT",
    targetValue: 100,
    actualValue: 76,
    progress: 76,
    weight: 25,
    scopeType: "TEAM",
    status: "ACTIVE",
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
  },
]

function formatValue(v: number, mt: string) {
  if (mt === "VND") {return new Intl.NumberFormat("vi-VN").format(v)}
  if (mt === "PERCENT") {return `${v}%`}
  return String(v)
}
function progressColor(p: number) {
  if (p >= 90) {return { text: "text-emerald-600", bar: "bg-emerald-500" }}
  if (p >= 60) {return { text: "text-orange-500", bar: "bg-orange-400" }}
  return { text: "text-red-600", bar: "bg-red-500" }
}

export default function KpiOkrManagement() {
  const t = SYSTEM_MESSAGES.KPI_OKR
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading] = useState(false)

  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {return mockData}
    return mockData.filter((row) =>
      row.name.toLowerCase().includes(q) ||
      (row.description ?? "").toLowerCase().includes(q)
    )
  }, [search])

  const totalWeight = items.reduce((sum, row) => sum + row.weight, 0)
  const totalTargets = items.length
  const daysLeft = 45
  const weightPct = Math.min(totalWeight, 100)
  const isActive = totalWeight >= 100
  const paginationRangeText = `1-4 `

  const handleSuccess = () => {
    setIsModalOpen(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          <div><h1 className="page-heading">{t.TITLE}</h1></div>

          <div className="max-w-7xl mx-auto space-y-6">

            {/* Summary */}
            <div className="card-soft p-6 flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <BarChart2 className="w-5 h-5 text-red-600" />
                  <span>{t.TOTAL_WEIGHT}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-red-600">{totalWeight}%</span>
                  <span className="text-sm text-muted-foreground font-medium">/ 100%</span>
                </div>
                <div className="w-full max-w-md bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all ${isActive ? "bg-emerald-500" : "bg-red-600"}`}
                    style={{ width: `${weightPct}%` }} />
                </div>
                <div className={`flex items-center gap-1.5 text-sm font-medium w-fit px-3 py-1 rounded-md ${isActive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                  {!isActive && <AlertTriangle className="w-4 h-4" />}
                  {isActive ? "Đã kích hoạt đầy đủ (100%)" : t.WARNING_WEIGHT}
                </div>
              </div>
              <div className="flex flex-col border-l pl-8 space-y-6 min-w-[200px]">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.TARGET_COUNT}</p>
                  <p className="text-2xl font-bold text-foreground">{totalTargets}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.DAYS_LEFT}</p>
                  <p className="text-2xl font-bold text-foreground">{daysLeft}{t.DAYS}</p>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t.SEARCH_PLACEHOLDER} className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" />{t.BTN_FILTER}</Button>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#e41b21] hover:bg-[#c9181d] text-white">
                  <Plus className="w-4 h-4" />{t.BTN_ADD}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="card-soft">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /><span>Đang tải dữ liệu...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <BarChart2 className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Chưa có mục tiêu nào. Nhấn "+ Thêm mục tiêu mới" để bắt đầu.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>{t.TABLE_NAME}</TableHead>
                      <TableHead>{t.TABLE_TYPE}</TableHead>
                      <TableHead className="text-center">{t.TABLE_WEIGHT}</TableHead>
                      <TableHead>{t.TABLE_METRIC}</TableHead>
                      <TableHead className="text-right">{t.TABLE_TARGET}</TableHead>
                      <TableHead className="text-right">{t.TABLE_ACTUAL}</TableHead>
                      <TableHead className="text-center">{t.TABLE_RATIO}</TableHead>
                      <TableHead className="text-center">{t.TABLE_ACTIONS}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(row => {
                      const c = progressColor(row.progress)
                      return (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                          <TableCell>
                            <p className="font-semibold text-foreground">{row.name}</p>
                            {row.description && <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{row.description}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border-transparent ${row.type === "KPI" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {row.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-foreground">{row.weight}%</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.metricType === "PERCENT" ? "Phần trăm (%)" : row.metricType === "VND" ? "Số tiền (VNĐ)" : "Số lượng"}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatValue(row.targetValue, row.metricType)}</TableCell>
                          <TableCell className="text-right font-medium">{formatValue(row.actualValue, row.metricType)}</TableCell>
                          <TableCell className="pl-6">
                            <div className="flex flex-col items-center gap-1.5 w-[80px]">
                              <span className={`font-bold ${c.text}`}>{row.progress.toFixed(0)}%</span>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${Math.min(row.progress, 100)}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Eye className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
                <span className="text-sm text-muted-foreground">{t.PAGINATION_SHOW}{paginationRangeText}{t.PAGINATION_ITEMS}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="bg-[#e41b21] hover:bg-[#c9181d] text-white w-8 h-8">
                    {1}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    {2}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    {3}
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </SidebarInset>

      <AddKpiOkrModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </SidebarProvider>
  )
}
