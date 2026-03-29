import { useState, useMemo } from "react";
import {
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SalarySlipSheet, type SalarySlip } from "./components/SalarySlipSheet";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  salaryHistoryApi,
  type PayrollSlipApi,
} from "@/services/salaryHistoryApi";

const PAGE_SIZE = 4;

function toSlip(p: PayrollSlipApi, idx: number): SalarySlip {
  return {
    id: idx + 1,
    period: p.period,
    paymentDate: p.paymentDate,
    baseSalary: p.baseSalary,
    bonus: p.bonus ?? [],
    allowances: p.allowances ?? [],
    deductions: p.deductions ?? [],
    totalIncome: p.totalIncome,
    totalDeductions: p.totalDeductions,
    netPay: p.netPay,
    status: p.status,
  };
}

export default function SalaryHistoryPage() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const t = SYSTEM_MESSAGES.SALARY_HISTORY;

  const {
    data: rawData = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-payroll-history"],
    queryFn: () => salaryHistoryApi.getMyHistory(),
    staleTime: 30_000,
  });

  const allSlips: SalarySlip[] = useMemo(
    () => rawData.map((element, idx) => toSlip(element, idx)),
    [rawData],
  );

  const filteredData = useMemo(() => {
    return allSlips.filter((row) => {
      const parts = row.period.replace("Tháng ", "").split("/");
      const rowMonth = parts[0] ?? "";
      const rowYear = parts[1] ?? "";
      return (
        (selectedYear === "all" || rowYear === selectedYear) &&
        (selectedMonth === "all" ||
          rowMonth === selectedMonth.padStart(2, "0")) &&
        (selectedStatus === "all" || row.status === selectedStatus)
      );
    });
  }, [allSlips, selectedYear, selectedMonth, selectedStatus]);

  const handleYearChange = (v: string) => {
    setSelectedYear(v);
    setCurrentPage(1);
  };
  const handleMonthChange = (v: string) => {
    setSelectedMonth(v);
    setCurrentPage(1);
  };
  const handleStatusChange = (v: string) => {
    setSelectedStatus(v as typeof selectedStatus);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = filteredData.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const startItem =
    filteredData.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, filteredData.length);
  const goTo = (p: number) =>
    setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const totalIncome = useMemo(() => {
    const s = filteredData.reduce(
      (a, r) => a + Number(r.totalIncome.replace(/[^\d]/g, "") || 0),
      0,
    );
    return s.toLocaleString("vi-VN") + "đ";
  }, [filteredData]);

  const avgNet = useMemo(() => {
    if (!filteredData.length) {
      return "0đ";
    }
    const s = filteredData.reduce(
      (a, r) => a + Number(r.netPay.replace(/[^\d]/g, "") || 0),
      0,
    );
    return Math.round(s / filteredData.length).toLocaleString("vi-VN") + "đ";
  }, [filteredData]);

  return (
    <>
      <main className="flex-1 space-y-6 lg:p-8 p-4 pt-6 bg-background min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Sticky header */}
          <div className="sticky top-0 z-20 bg-background pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="page-heading">{t.TITLE}</h1>
              <p className="text-muted-foreground mt-1">{t.DESC}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[110px] bg-background">
                  <SelectValue placeholder={t.LABEL_YEAR} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {["2026", "2025", "2024", "2023"].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tháng</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="card-soft p-6">
              <p className="text-sm text-muted-foreground mb-2">
                {t.STATS_TOTAL_INCOME}
              </p>
              <p className="text-2xl font-bold">
                {isLoading ? "—" : totalIncome}
              </p>
            </div>
            <div className="card-soft p-6">
              <p className="text-sm text-muted-foreground mb-2">
                {t.STATS_AVG_NET}
              </p>
              <p className="text-2xl font-bold">{isLoading ? "—" : avgNet}</p>
            </div>
            <div className="card-soft p-6">
              <p className="text-sm text-muted-foreground mb-2">
                {t.STATS_NEXT_PERIOD}
              </p>
              <p className="text-2xl font-bold text-primary">05/06/2024</p>
            </div>
          </div>

          {/* Table */}
          <div className="card-soft">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t.TABLE_PERIOD}</TableHead>
                  <TableHead>{t.TABLE_PAYMENT_DATE}</TableHead>
                  <TableHead>{t.TABLE_TOTAL_INCOME}</TableHead>
                  <TableHead>{t.TABLE_DEDUCTIONS}</TableHead>
                  <TableHead>{t.TABLE_NET_PAY}</TableHead>
                  <TableHead className="text-right">
                    {SYSTEM_MESSAGES.LABEL_ACTION}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải dữ liệu lương...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-destructive text-sm"
                    >
                      Không thể tải dữ liệu. Vui lòng thử lại.
                    </TableCell>
                  </TableRow>
                ) : pagedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {SYSTEM_MESSAGES.COMMON_EN.NO_DATA}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedSlip(row)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">
                            {row.period}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.paymentDate}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.totalIncome}
                      </TableCell>
                      <TableCell className="text-primary">
                        {row.totalDeductions}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 pointer-events-none text-sm font-bold">
                          {row.netPay}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSlip(row);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="px-5 py-3 flex items-center justify-between border-t bg-muted/20 flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredData.length === 0
                  ? "Không có dữ liệu"
                  : `${t.PAGINATION_SHOW} ${startItem}–${endItem} ${t.PAGINATION_ON_TOTAL} ${filteredData.length} ${t.PAGINATION_PERIODS}`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === 1}
                  onClick={() => goTo(safePage - 1)}
                  className="w-8 h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === safePage ? "default" : "ghost"}
                      size="icon"
                      className={`w-8 h-8 ${page === safePage ? "bg-[#e41b21] hover:bg-[#c9181d] text-white" : ""}`}
                      onClick={() => goTo(page)}
                    >
                      {page}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={safePage === totalPages}
                  onClick={() => goTo(safePage + 1)}
                  className="w-8 h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SalarySlipSheet
        slip={selectedSlip}
        open={!!selectedSlip}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlip(null);
          }
        }}
      />
    </>
  );
}
