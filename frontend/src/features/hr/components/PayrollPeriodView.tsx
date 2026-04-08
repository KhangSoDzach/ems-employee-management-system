import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Loader2,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  payrollPeriodApi,
  type PayrollSummaryRow,
} from "@/services/payrollPeriodApi";
import { PAYROLL_HR_CONSTANTS } from "../../../constants/payroll.constants";
import { SYSTEM_MESSAGES } from "@/constants/messages";

const PERIOD_REGEX = PAYROLL_HR_CONSTANTS.VIEW.PERIOD_REGEX;
const PAGE_SIZE = PAYROLL_HR_CONSTANTS.VIEW.DEFAULT_PAGE_SIZE;

function getCurrentPeriod() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function fmtVND(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "0đ";
  }
  return Math.round(value).toLocaleString("vi-VN") + "đ";
}

const STATUS_LABELS: Record<string, string> =
  PAYROLL_HR_CONSTANTS.VIEW.STATUS_LABELS;

export function PayrollPeriodView() {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [inputPeriod, setInputPeriod] = useState(period);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const query = useQuery({
    queryKey: ["payroll-period", period],
    queryFn: () => payrollPeriodApi.getByPeriod(period),
    enabled: PERIOD_REGEX.test(period),
    staleTime: 60_000,
  });

  const handleSearch = () => {
    if (!PERIOD_REGEX.test(inputPeriod)) {
      toast.error(PAYROLL_HR_CONSTANTS.MESSAGES.ERROR_PERIOD_INVALID);
      return;
    }
    setPeriod(inputPeriod);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      payrollPeriodApi.exportCsv(period);
      toast.success(PAYROLL_HR_CONSTANTS.MESSAGES.EXPORT_SUCCESS(period));
    } catch {
      toast.error(PAYROLL_HR_CONSTANTS.MESSAGES.EXPORT_ERROR);
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  const result = query.data;
  const allRows = result?.payrolls ?? [];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = allRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const startItem = allRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safePage * PAGE_SIZE, allRows.length);
  const goTo = (p: number) =>
    setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="flex flex-col rounded-xl border border-border shadow-sm bg-card overflow-hidden">
      {/* ── STICKY HEADER — controls + summary ─────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 pt-5 pb-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="hr-period"
              className="text-sm font-semibold text-muted-foreground uppercase"
            >
              {PAYROLL_HR_CONSTANTS.VIEW.LABEL_PERIOD}
            </label>
            <input
              id="hr-period"
              type="month"
              value={inputPeriod}
              onChange={(e) => setInputPeriod(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={query.isFetching}
            className="rounded-xl shadow-md shadow-primary/20"
          >
            {query.isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {SYSTEM_MESSAGES.LOADING}
              </>
            ) : (
              PAYROLL_HR_CONSTANTS.VIEW.BTN_SEARCH
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || !result || allRows.length === 0}
            className="gap-2 rounded-xl"
          >
            <Download className="h-4 w-4" />
            {exporting
              ? PAYROLL_HR_CONSTANTS.VIEW.EXPORTING
              : PAYROLL_HR_CONSTANTS.VIEW.BTN_EXPORT}
          </Button>
          {result && (
            <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">
                  {PAYROLL_HR_CONSTANTS.VIEW.SUMMARY.LABEL_EMPLOYEES}
                </span>
                <span className="font-bold text-base">
                  {result.totalEmployees}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Wallet className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">
                  {PAYROLL_HR_CONSTANTS.VIEW.SUMMARY.LABEL_TOTAL_NET}
                </span>
                <span className="font-bold text-base text-primary">
                  {fmtVND(result.totalNetPayroll)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE TABLE AREA ────────────────────────────────────────── */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 420px)", minHeight: "200px" }}
      >
        {query.isError ? (
          <p className="text-sm text-destructive py-8 text-center font-medium">
            {PAYROLL_HR_CONSTANTS.MESSAGES.FETCH_ERROR}
          </p>
        ) : pagedRows.length > 0 ? (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <TableRow className="hover:bg-muted/40 border-none">
                <TableHead className="font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.EMP_CODE}
                </TableHead>
                <TableHead className="font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.NAME}
                </TableHead>
                <TableHead className="font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.DEPT}
                </TableHead>
                <TableHead className="text-right font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.BASIC}
                </TableHead>
                <TableHead className="text-right font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.ALLOWANCE}
                </TableHead>
                <TableHead className="text-right font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.DEDUCTION}
                </TableHead>
                <TableHead className="text-right font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.NET}
                </TableHead>
                <TableHead className="font-bold text-foreground">
                  {PAYROLL_HR_CONSTANTS.VIEW.TABLE.STATUS}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.map((row: PayrollSummaryRow) => (
                <TableRow key={row.payrollId}>
                  <TableCell className="font-medium text-sm">
                    {row.employeeCode}
                  </TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.department}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {fmtVND(row.basicSalary)}
                  </TableCell>
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
            {SYSTEM_MESSAGES.LOADING}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-12 px-6">
            <p className="font-medium">
              {PAYROLL_HR_CONSTANTS.MESSAGES.EMPTY_DATA(period)}
            </p>
          </div>
        )}
      </div>

      {/* ── STICKY PAGINATION FOOTER ────────────────────────────────────── */}
      {allRows.length > 0 && (
        <div
          className="flex-shrink-0 border-t border-border bg-card px-5 py-3
                        flex items-center justify-between flex-wrap gap-2"
        >
          <span className="text-sm text-muted-foreground font-medium">
            {PAYROLL_HR_CONSTANTS.VIEW.PAGINATION.SHOW} {startItem}
            {PAYROLL_HR_CONSTANTS.VIEW.PAGINATION.TO}
            {endItem} {PAYROLL_HR_CONSTANTS.VIEW.PAGINATION.ON_TOTAL}{" "}
            {allRows.length} {PAYROLL_HR_CONSTANTS.VIEW.PAGINATION.UNIT_EMP}
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === safePage ? "default" : "ghost"}
                size="icon"
                className={`w-8 h-8 ${page === safePage ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
                onClick={() => goTo(page)}
              >
                {page}
              </Button>
            ))}

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
      )}
    </div>
  );
}
