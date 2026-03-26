import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Package,
  FileText,
  Filter,
  Eye,
  MoreHorizontal,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assetService,
  AdminIncidentListItem,
  IncidentReportDetail,
} from "@/services/assetService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { AssetReportReviewSheet } from "./components/AssetReportReviewSheet";

export default function AssetReportManagement() {
  const effectiveRole = useEffectiveRole();

  const [reports, setReports] = useState<AdminIncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status] = useState<string>("");

  const [selectedReport, setSelectedReport] =
    useState<IncidentReportDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const paginatedItems = reports.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [keyword, status, reports]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetService.getAllReports({
        keyword: keyword || undefined,
        status: status || undefined,
        page: 0,
        size: 1000,
      });
      setReports(data.content);
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_FETCH_LIST_ERROR);
    } finally {
      setLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await assetService.getAdminReportDetail(id);
      setSelectedReport(detail);
      setDetailOpen(true);
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_FETCH_DETAIL_ERROR);
    }
  };

  const handleProcess = async (
    id: number,
    note: string,
    type: "APPROVE" | "REJECT",
  ) => {
    try {
      if (type === "APPROVE") {
        await assetService.approveReport(id, note);
        toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_APPROVE_SUCCESS, {
          description: SYSTEM_MESSAGES.ASSET_REPORT.MSG_APPROVE_DESC,
          icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />,
        });
      } else {
        await assetService.rejectReport(id, note);
        toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_REJECT_SUCCESS);
      }
      setDetailOpen(false);
      fetchReports();
    } catch (error) {
      toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_PROCESS_ERROR, {
        // @ts-expect-error - Expected error type from axios
        description:
          error.response?.data?.message ||
          SYSTEM_MESSAGES.ASSET_REPORT.MSG_TRY_AGAIN,
      });
      throw error;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="page-layout-wrapper">
          {/* ── Page Header ── */}
          <div className="page-header mb-6">
            <div className="space-y-1">
              <h1 className="page-heading">
                {SYSTEM_MESSAGES.ASSET_REPORT.TITLE}
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                {SYSTEM_MESSAGES.ASSET_REPORT.DESC}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={SYSTEM_MESSAGES.ASSET_REPORT.SEARCH_PLACEHOLDER}
                  className="pl-9 h-10 w-full bg-white dark:bg-slate-900 border-slate-200 shadow-sm rounded-xl text-sm font-medium"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl bg-white dark:bg-slate-900 border-slate-200 shadow-sm hover:bg-slate-50"
              >
                <Filter className="w-4 h-4 text-slate-600" />
              </Button>
            </div>
          </div>

          {/* ── Dashboard Stats ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: SYSTEM_MESSAGES.ASSET_REPORT.STATS.TOTAL,
                value: reports.length,
                icon: FileText,
                color: "blue",
              },
              {
                label: SYSTEM_MESSAGES.ASSET_REPORT.STATS.PENDING,
                value: reports.filter((r) => r.status === "PENDING").length,
                icon: AlertTriangle,
                color: "amber",
              },
              {
                label: SYSTEM_MESSAGES.ASSET_REPORT.STATS.APPROVED,
                value: reports.filter((r) => r.status === "APPROVED").length,
                icon: CheckCircle2,
                color: "emerald",
              },
              {
                label: SYSTEM_MESSAGES.ASSET_REPORT.STATS.REJECTED,
                value: reports.filter((r) => r.status === "REJECTED").length,
                icon: XCircle,
                color: "rose",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="stat-card-default flex items-center justify-between group transition-all hover:shadow-md"
              >
                <div>
                  <p className="stat-label-default">{stat.label}</p>
                  <p className="stat-value-lg text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <stat.icon
                    className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ── Reports List ── */}
          <div className="data-table-container">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {SYSTEM_MESSAGES.ASSET_REPORT.INCOMING_REPORTS}
              </h3>
            </div>

            <Table className="data-table">
              <TableHeader className="data-table-header">
                <TableRow className="bg-transparent hover:bg-transparent">
                  <TableHead className="data-table-header-cell">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.CODE}
                  </TableHead>
                  <TableHead className="data-table-header-cell">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.EMPLOYEE}
                  </TableHead>
                  <TableHead className="data-table-header-cell">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.ASSET}
                  </TableHead>
                  <TableHead className="data-table-header-cell">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.ISSUE_TYPE}
                  </TableHead>
                  <TableHead className="data-table-header-cell">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.REPORT_DATE}
                  </TableHead>
                  <TableHead className="data-table-header-cell text-center">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.STATUS}
                  </TableHead>
                  <TableHead className="data-table-header-cell text-right">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.ACTIONS}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell
                        colSpan={7}
                        className="h-20 bg-slate-50/20"
                      ></TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((report) => (
                    <TableRow key={report.id} className="data-table-row group">
                      <TableCell className="data-table-cell">
                        <span className="font-black text-primary text-sm tracking-tighter">
                          {SYSTEM_MESSAGES.ASSET_REPORT.TXT_HASH}
                          {report.reportId}
                        </span>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-3">
                          <div className="avatar-small">
                            {report.employeeName.split(" ").pop()?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 text-[13px] tracking-tight">
                            {report.employeeName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-1">
                            {report.asset}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-50"
                        >
                          {report.issueTypeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-tighter">
                          <Calendar className="w-3.5 h-3.5 opacity-40" />
                          {report.reportedAt}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell text-center">
                        <div className="flex justify-center">
                          <Badge
                            className={`status-badge-pill ${report.statusColor} border-none shadow-sm`}
                          >
                            {report.statusLabel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0 rounded-xl hover:bg-white shadow-none group"
                            >
                              <MoreHorizontal className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 p-2 rounded-2xl shadow-2xl border-none ring-1 ring-slate-100"
                          >
                            <DropdownMenuItem
                              className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest gap-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer"
                              onClick={() => handleViewDetail(report.id)}
                            >
                              <Eye className="w-4 h-4" />
                              {SYSTEM_MESSAGES.ASSET_REPORT.BTN_VIEW_DETAIL}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <Package className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-widest text-[11px]">
                          {SYSTEM_MESSAGES.ASSET_REPORT.EMPTY_TITLE}
                        </p>
                        <p className="text-slate-400 font-bold text-xs max-w-xs">
                          {SYSTEM_MESSAGES.ASSET_REPORT.EMPTY_DESC}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 bg-slate-50/20 font-bold">
              <span className="uppercase tracking-widest text-[10px]">
                {reports.length > 0 ? page * PAGE_SIZE + 1 : 0}-
                {Math.min((page + 1) * PAGE_SIZE, reports.length)}{" "}
                {SYSTEM_MESSAGES.SYMBOLS.SLASH} {reports.length}{" "}
                {SYSTEM_MESSAGES.ASSET_REPORT.UNIT_REPORT}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-slate-200 bg-white shadow-sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </Button>
                  <span className="px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-slate-200 bg-white shadow-sm"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>

      <AssetReportReviewSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        report={selectedReport}
        onApprove={(id, note) => handleProcess(id, note, "APPROVE")}
        onReject={(id, note) => handleProcess(id, note, "REJECT")}
      />
    </SidebarProvider>
  );
}
