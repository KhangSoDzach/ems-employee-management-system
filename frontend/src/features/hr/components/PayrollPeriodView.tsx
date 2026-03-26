import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, Loader2, Users, Wallet, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

import { payrollPeriodApi, type PayrollSummaryRow } from "@/services/payrollPeriodApi"

const PERIOD_REGEX = /^\d{4}-\d{2}$/
const PAGE_SIZE    = 10

function getCurrentPeriod() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`
}

function fmtVND(value: number | null | undefined) {
  if (value === null || value === undefined) { return "0đ" }
  return Math.round(value).toLocaleString("vi-VN") + "đ"
}

const STATUS_LABELS: Record<string, string> = {
  PROCESSED: "Đã tính",
  PAID:      "Đã thanh toán",
  DRAFT:     "Nháp",
  CANCELLED: "Đã huỷ",
}

export function PayrollPeriodView() {
  const [period,      setPeriod]      = useState(getCurrentPeriod)
  const [inputPeriod, setInputPeriod] = useState(period)
  const [exporting,   setExporting]   = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const query = useQuery({
    queryKey:  ["payroll-period", period],
    queryFn:   () => payrollPeriodApi.getByPeriod(period),
    enabled:   PERIOD_REGEX.test(period),
    staleTime: 60_000,
  })

  const handleSearch = () => {
    if (!PERIOD_REGEX.test(inputPeriod)) {
      toast.error("Kỳ lương không hợp lệ. Ví dụ đúng: 2026-03")
      return
    }
    setPeriod(inputPeriod)
    setCurrentPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      payrollPeriodApi.exportCsv(period)
      toast.success(`Đang tải xuống bảng lương kỳ ${period}...`)
    } catch {
      toast.error("Xuất CSV thất bại. Vui lòng thử lại.")
    } finally {
      setTimeout(() => setExporting(false), 2000)
    }
  }

  const result  = query.data
  const allRows = result?.payrolls ?? []

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const pagedRows  = allRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const startItem  = allRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endItem    = Math.min(safePage * PAGE_SIZE, allRows.length)
  const goTo       = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)))

  return (
    <div className="flex flex-col rounded-xl border shadow-sm bg-white dark:bg-slate-900">

      {/* ── STICKY HEADER — controls + summary ─────────────────────────── */}
      <div className="flex-shrink-0 border-b bg-white dark:bg-slate-900 px-6 pt-5 pb-4 space-y-4">
<div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="hr-period" className="text-sm font-medium">Kỳ lương</label>
            <input
              id="hr-period"
              type="month"
              value={inputPeriod}
              onChange={e => setInputPeriod(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { handleSearch() } }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button onClick={handleSearch} disabled={query.isFetching}>
            {query.isFetching
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tải...</>
              : "Xem bảng lương"}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || !result || allRows.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </Button>
        </div>

        {result && (
          <div className="flex items-center gap-6 rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nhân viên:</span>
              <span className="font-semibold">{result.totalEmployees}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tổng lương net:</span>
              <span className="font-semibold text-emerald-600">{fmtVND(result.totalNetPayroll)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE TABLE AREA ────────────────────────────────────────── */}
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 420px)", minHeight: "200px" }}>
        {query.isError ? (
          <p className="text-sm text-destructive py-8 text-center">
            Không thể tải dữ liệu kỳ này. Vui lòng thử lại.
          </p>
        ) : pagedRows.length > 0 ? (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b">
              <TableRow className="hover:bg-muted/40">
                <TableHead>Mã NV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead className="text-right">Lương CB</TableHead>
                <TableHead className="text-right">Phụ cấp</TableHead>
                <TableHead className="text-right">Khấu trừ BH</TableHead>
                <TableHead className="text-right">Thực lĩnh</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.map((row: PayrollSummaryRow) => (
                <TableRow key={row.payrollId}>
                  <TableCell className="font-medium text-sm">{row.employeeCode}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.department}</TableCell>
                  <TableCell className="text-right text-sm">{fmtVND(row.basicSalary)}</TableCell>
                  <TableCell className="text-right text-sm text-emerald-600">
                    +{fmtVND(row.allowances)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-primary">
                    -{fmtVND(row.insuranceDeduction)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-sm pointer-events-none">
                      {fmtVND(row.netPay)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : query.isFetching ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            Chưa có dữ liệu lương cho kỳ <strong>{period}</strong>.
            Hãy chạy Run Payroll trước.
          </p>
        )}
      </div>

      {/* ── STICKY PAGINATION FOOTER ────────────────────────────────────── */}
      {allRows.length > 0 && (
        <div className="flex-shrink-0 border-t bg-white dark:bg-slate-900 px-5 py-3
                        flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            Hiển thị {startItem}–{endItem} trên tổng số {allRows.length} nhân viên
          </span>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={safePage === 1}
                    onClick={() => goTo(safePage - 1)} className="w-8 h-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === safePage ? "default" : "ghost"}
                size="icon"
                className={`w-8 h-8 ${page === safePage ? "bg-[#e41b21] hover:bg-[#c9181d] text-white" : ""}`}
                onClick={() => goTo(page)}
              >
                {page}
              </Button>
            ))}

            <Button variant="outline" size="icon" disabled={safePage === totalPages}
                    onClick={() => goTo(safePage + 1)} className="w-8 h-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
