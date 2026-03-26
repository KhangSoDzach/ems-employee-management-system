import { useState, useEffect } from "react";
import { Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

const MOCK_SALARY_DATA: SalarySlip[] = [
  {
    id: 1,
    period: "Tháng 04/2024",
    paymentDate: "05/05/2024",
    baseSalary: "23,000,000đ",
    bonus: [],
    allowances: [
      { label: "Phụ cấp ăn trưa", amount: "730,000đ" },
      { label: "Phụ cấp đi lại", amount: "500,000đ" },
      { label: "Phụ cấp điện thoại", amount: "200,000đ" },
    ],
    deductions: [
      { label: "BHXH (8%)", amount: "2,000,000đ" },
      { label: "BHYT (1.5%)", amount: "375,000đ" },
      { label: "BHTN (1%)", amount: "250,000đ" },
      { label: "Thuế TNCN", amount: "1,150,000đ" },
    ],
    totalIncome: "25,000,000đ",
    totalDeductions: "3,775,000đ",
    netPay: "22,225,000đ",
    status: "paid",
  },
  {
    id: 2,
    period: "Tháng 03/2024",
    paymentDate: "05/04/2024",
    baseSalary: "23,000,000đ",
    bonus: [],
    allowances: [
      { label: "Phụ cấp ăn trưa", amount: "730,000đ" },
      { label: "Phụ cấp đi lại", amount: "500,000đ" },
    ],
    deductions: [
      { label: "BHXH (8%)", amount: "2,000,000đ" },
      { label: "BHYT (1.5%)", amount: "375,000đ" },
      { label: "BHTN (1%)", amount: "250,000đ" },
      { label: "Thuế TNCN", amount: "1,150,000đ" },
    ],
    totalIncome: "24,230,000đ",
    totalDeductions: "3,775,000đ",
    netPay: "20,455,000đ",
    status: "pending",
  },
  {
    id: 3,
    period: "Tháng 02/2024",
    paymentDate: "05/03/2024",
    baseSalary: "25,000,000đ",
    bonus: [],
    allowances: [
      { label: "Phụ cấp ăn trưa", amount: "730,000đ" },
      { label: "Phụ cấp đi lại", amount: "500,000đ" },
      { label: "Phụ cấp điện thoại", amount: "200,000đ" },
    ],
    deductions: [
      { label: "BHXH (8%)", amount: "2,000,000đ" },
      { label: "BHYT (1.5%)", amount: "375,000đ" },
      { label: "BHTN (1%)", amount: "250,000đ" },
      { label: "Thuế TNCN", amount: "1,150,000đ" },
    ],
    totalIncome: "28,000,000đ",
    totalDeductions: "3,775,000đ",
    netPay: "24,225,000đ",
    status: "paid",
  },
  {
    id: 4,
    period: "Tháng 01/2024",
    paymentDate: "05/02/2024",
    baseSalary: "23,000,000đ",
    bonus: [],
    allowances: [
      { label: "Phụ cấp ăn trưa", amount: "730,000đ" },
      { label: "Phụ cấp đi lại", amount: "500,000đ" },
    ],
    deductions: [
      { label: "BHXH (8%)", amount: "2,000,000đ" },
      { label: "BHYT (1.5%)", amount: "375,000đ" },
      { label: "BHTN (1%)", amount: "250,000đ" },
      { label: "Thuế TNCN", amount: "1,150,000đ" },
    ],
    totalIncome: "24,230,000đ",
    totalDeductions: "3,775,000đ",
    netPay: "20,455,000đ",
    status: "pending",
  },
];

export default function SalaryHistoryPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [page, setPage] = useState(0);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const t = SYSTEM_MESSAGES.SALARY_HISTORY;
  const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

  const filteredData = MOCK_SALARY_DATA.filter((row) => {
    const [, month, year] = row.paymentDate.split("/");

    const matchesYear = selectedYear === "all" || year === selectedYear;
    const matchesMonth = selectedMonth === "all" || month === selectedMonth;
    const matchesStatus =
      selectedStatus === "all" || row.status === selectedStatus;

    return matchesYear && matchesMonth && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [selectedYear, selectedMonth, selectedStatus]);

  return (
    <SidebarProvider>
      <AppSidebar role="employee" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 lg:p-8 p-4 pt-6 bg-background min-h-screen">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="page-heading">{t.TITLE}</h1>
                <p className="text-muted-foreground mt-1">{t.DESC}</p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px] bg-background">
                    <SelectValue placeholder={t.LABEL_YEAR} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả năm</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[130px] bg-background">
                    <SelectValue placeholder="Chọn tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tháng</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <SelectItem key={month} value={month.toString()}>
                          Tháng {month}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(v) =>
                    setSelectedStatus(v as "all" | "paid" | "pending")
                  }
                >
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="card-soft p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t.STATS_TOTAL_INCOME}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  103,000,000đ
                </p>
              </div>
              <div className="card-soft p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t.STATS_AVG_NET}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  23,125,000đ
                </p>
              </div>
              <div className="card-soft p-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t.STATS_NEXT_PERIOD}
                </p>
                <p className="text-2xl font-bold text-primary">05/06/2024</p>
              </div>
            </div>

            {/* Table Container */}
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
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {SYSTEM_MESSAGES.COMMON_EN.NO_DATA}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelectedSlip(row)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
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

                        <TableCell className="font-medium text-foreground">
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
              <div className="px-5 py-3 flex items-center justify-between border-t bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  {t.PAGINATION_SHOW} {page * PAGE_SIZE + 1}-
                  {Math.min((page + 1) * PAGE_SIZE, filteredData.length)}{" "}
                  {t.PAGINATION_ON_TOTAL} {filteredData.length}{" "}
                  {t.PAGINATION_PERIODS}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="w-8 h-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages - 1}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      className="w-8 h-8"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>

      <SalarySlipSheet
        slip={selectedSlip}
        open={!!selectedSlip}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlip(null);
          }
        }}
      />
    </SidebarProvider>
  );
}
