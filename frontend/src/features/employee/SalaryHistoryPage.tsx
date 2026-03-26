import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Calendar, Eye, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
import { salaryHistoryApi } from "@/services/salaryHistoryApi";

export default function SalaryHistoryPage() {
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
  const [openSlip, setOpenSlip] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["salaryHistory", selectedYear],
    queryFn: () =>
      salaryHistoryApi.getMyHistory({
        year: selectedYear === "all" ? undefined : Number(selectedYear),
      }),
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const t = SYSTEM_MESSAGES.SALARY_HISTORY;

  // Transform API data to UI format
  const slips = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      id: Number(item.id),
      status: (item.status === "paid" ? "paid" : "pending") as
        | "paid"
        | "pending",
    }));
  }, [data]);

  const handleViewSlip = (slip: SalarySlip) => {
    setSelectedSlip(slip);
    setOpenSlip(true);
  };

  const totalIncome = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return "0 ₫";
    }
    // Summary logic: parse VND strings back to numbers for aggregation
    const sum = data.reduce((acc, curr) => {
      const val = Number(curr.netPay.replace(/[^\d]/g, "")) || 0;
      return acc + val;
    }, 0);
    return sum.toLocaleString("vi-VN") + " ₫";
  }, [data]);

  const avgNet = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "0 ₫";
    }
    const sum = data.reduce((acc, curr) => {
      const val = Number(curr.netPay.replace(/[^\d]/g, "")) || 0;
      return acc + val;
    }, 0);
    return Math.round(sum / data.length).toLocaleString("vi-VN") + " ₫";
  }, [data]);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" role="employee" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 space-y-6 bg-slate-50/50">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="page-heading">{t.TITLE}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t.DESC}</p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[140px] bg-white rounded-xl">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả năm</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="rounded-xl bg-white">
                  Xuất PDF
                </Button>
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
                <p className="text-2xl font-bold text-primary">
                  {(() => {
                    const next = new Date();
                    next.setMonth(next.getMonth() + 1);
                    next.setDate(5);
                    return format(next, "dd/MM/yyyy");
                  })()}
                </p>
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
                    <TableHead>{SYSTEM_MESSAGES.LABEL_STATUS}</TableHead>
                    <TableHead className="text-right">
                      {SYSTEM_MESSAGES.LABEL_ACTION}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{SYSTEM_MESSAGES.LOADING}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : slips.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-48 text-center text-muted-foreground"
                      >
                        {SYSTEM_MESSAGES.NO_DATA}
                      </TableCell>
                    </TableRow>
                  ) : (
                    slips.map((slip) => (
                      <TableRow key={slip.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold">
                          {slip.period}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {slip.paymentDate}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {slip.totalIncome}
                        </TableCell>
                        <TableCell className="text-red-500">
                          {slip.totalDeductions}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {slip.netPay}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              slip.status === "paid" ? "secondary" : "outline"
                            }
                            className="font-medium"
                          >
                            {slip.status === "paid"
                              ? "Đã trả"
                              : "Chờ thanh toán"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => handleViewSlip(slip)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t.BTN_VIEW_SLIP}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* No pagination as API returns full list */}
            </div>
          </div>
        </main>

        <SalarySlipSheet
          open={openSlip}
          onOpenChange={setOpenSlip}
          slip={selectedSlip}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
