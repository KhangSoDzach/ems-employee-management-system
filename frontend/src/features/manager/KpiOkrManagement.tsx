  import { useState } from "react"
import { Search, Filter, Plus, Pencil, Eye, ChevronLeft, ChevronRight, BarChart2, AlertTriangle } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { AddKpiOkrModal } from "./components/AddKpiOkrModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

// Mock data based on the screenshot
const mockData = [
  {
    id: 1,
    name: "Tăng doanh thu mảng Cloud",
    desc: "Mục tiêu tài chính quý 4",
    type: "KPI",
    weight: 25,
    metric: "Doanh thu thuần (VNĐ)",
    target: "5,000,000,000",
    actual: "4,250,000,000",
    ratio: 85,
    status: "good"
  },
  {
    id: 2,
    name: "Ra mắt tính năng AI mới",
    desc: "Phát triển sản phẩm lõi",
    type: "OKR",
    weight: 20,
    metric: "Số module hoàn thiện",
    target: "10",
    actual: "7",
    ratio: 70,
    status: "warning"
  },
  {
    id: 3,
    name: "Giảm tỷ lệ khách hàng rời bỏ",
    desc: "Chăm sóc khách hàng",
    type: "KPI",
    weight: 20,
    metric: "Churn Rate (%)",
    target: "2.5%",
    actual: "2.8%",
    ratio: 89,
    status: "good"
  },
  {
    id: 4,
    name: "Nâng cao văn hoá doanh nghiệp",
    desc: "Quản trị nhân sự",
    type: "OKR",
    weight: 20,
    metric: "eNPS Score",
    target: "75",
    actual: "70",
    ratio: 93,
    status: "good"
  }
]

export default function KpiOkrManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const t = SYSTEM_MESSAGES.KPI_OKR

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />
      <SidebarInset>
        <SiteHeader />
        
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-heading">{t.TITLE}</h1>
            </div>
          </div>

          <div className="max-w-7xl mx-auto space-y-6">
            {/* Summary Card */}
            <div className="card-soft p-6 flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <BarChart2 className="w-5 h-5 text-red-600" />
                  <span>{t.TOTAL_WEIGHT}</span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-red-600">{t.MOCK_WEIGHT}</span>
                  <span className="text-sm text-muted-foreground font-medium">{t.MOCK_TOTAL}</span>
                </div>
                
                <div className="w-full max-w-md bg-muted rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-red-600 h-2.5 rounded-full" 
                    style={{ width: "85%" }}
                  ></div>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 w-fit px-3 py-1 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                  {t.WARNING_WEIGHT}
                </div>
              </div>

              <div className="flex flex-col border-l pl-8 h-full space-y-6 min-w-[200px]">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.TARGET_COUNT}</p>
                  <p className="text-2xl font-bold text-foreground">{t.MOCK_TARGET}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{t.DAYS_LEFT}</p>
                  <p className="text-2xl font-bold text-foreground">{t.MOCK_DAYS}{t.DAYS}</p>
                </div>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder={t.SEARCH_PLACEHOLDER}
                  className="pl-9" 
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {t.BTN_FILTER}
                </Button>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="gap-2 bg-[#e41b21] hover:bg-[#c9181d] text-white"
                >
                  <Plus className="w-4 h-4" />
                  {t.BTN_ADD}
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="card-soft">
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
                  {mockData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell>
                        <p className="font-semibold text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{row.desc}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-transparent ${
                          row.type === 'KPI' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                        }`}>
                          {row.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground">{row.weight}{SYSTEM_MESSAGES.SYMBOLS.PERCENT}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <p className="max-w-[120px] truncate">{row.metric}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">{row.target}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">{row.actual}</TableCell>
                      <TableCell className="pl-6 md:pl-8">
                        <div className="flex flex-col items-center gap-1.5 w-[80px]">
                          <span className={`font-bold ${row.status === 'good' ? 'text-emerald-600' : 'text-orange-500'}`}>
                            {row.ratio}{SYSTEM_MESSAGES.SYMBOLS.PERCENT}
                          </span>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${row.status === 'good' ? 'bg-emerald-500' : 'bg-orange-400'}`}
                              style={{ width: `${row.ratio}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
                <span className="text-sm text-muted-foreground">{t.PAGINATION_SHOW}{t.PAGINATION_RANGE}{t.PAGINATION_ITEMS}</span>
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

      <AddKpiOkrModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </SidebarProvider>
  )
}
