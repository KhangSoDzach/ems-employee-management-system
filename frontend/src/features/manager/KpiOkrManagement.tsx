import { useState } from "react"
import {  Search, Filter, Plus, Pencil, Eye, ChevronLeft, ChevronRight, BarChart2, AlertTriangle } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { AddKpiOkrModal } from "./components/AddKpiOkrModal"

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
        <main className="flex-1 bg-slate-50 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">{t.TITLE}</h1>
          </div>
          <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start justify-between shadow-sm">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <BarChart2 className="w-5 h-5 text-red-600" />
              <span>{t.TOTAL_WEIGHT}</span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-red-600">85%</span>
              <span className="text-sm text-slate-500 font-medium">/ 100% mục tiêu</span>
            </div>
            
            <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden">
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

          <div className="flex flex-col border-l border-slate-200 pl-8 h-full space-y-6 min-w-[200px]">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">{t.TARGET_COUNT}</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">{t.DAYS_LEFT}</p>
              <p className="text-2xl font-bold">5 {t.DAYS}</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.SEARCH_PLACEHOLDER}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
              <Filter className="w-4 h-4" />
              {t.BTN_FILTER}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#e41b21] hover:bg-[#c9181d] text-white rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              {t.BTN_ADD}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4">{t.TABLE_NAME}</th>
                  <th className="px-6 py-4">{t.TABLE_TYPE}</th>
                  <th className="px-6 py-4 text-center">{t.TABLE_WEIGHT}</th>
                  <th className="px-6 py-4">{t.TABLE_METRIC}</th>
                  <th className="px-6 py-4 text-right">{t.TABLE_TARGET}</th>
                  <th className="px-6 py-4 text-right">{t.TABLE_ACTUAL}</th>
                  <th className="px-6 py-4 text-center">{t.TABLE_RATIO}</th>
                  <th className="px-6 py-4 text-center">{t.TABLE_ACTIONS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{row.desc}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        row.type === 'KPI' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{row.weight}%</td>
                    <td className="px-6 py-4 text-slate-500">
                      <p className="max-w-[120px] truncate">{row.metric}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{row.target}</td>
                    <td className="px-6 py-4 text-right font-medium">{row.actual}</td>
                    <td className="px-6 py-4 pl-8">
                      <div className="flex flex-col items-center gap-1.5 w-[80px]">
                        <span className={`font-bold ${row.status === 'good' ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {row.ratio}%
                        </span>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${row.status === 'good' ? 'bg-emerald-500' : 'bg-orange-400'}`}
                            style={{ width: `${row.ratio}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <button className="hover:text-slate-700 transition"><Pencil className="w-4 h-4" /></button>
                        <button className="hover:text-slate-700 transition"><Eye className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <span className="text-sm text-slate-500">{t.PAGINATION_SHOW} 4/12 {t.PAGINATION_ITEMS}</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-[#e41b21] font-medium text-white shadow-sm">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white font-medium hover:bg-slate-50 transition">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white font-medium hover:bg-slate-50 transition">
                3
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
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
