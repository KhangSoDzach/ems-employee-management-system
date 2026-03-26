import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Package,
  Filter,
  Eye,
  MoreHorizontal,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [status, setStatus] = useState<string>("ALL");

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
        status: status === "ALL" ? undefined : status,
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
        description:
          // @ts-expect-error - axios-style error property access on unknown error type
          error.response?.data?.message ||
          SYSTEM_MESSAGES.ASSET_REPORT.MSG_TRY_AGAIN,
      });
      throw error;
    }
  };

  const getReportStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.PENDING;
      case "APPROVED":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.APPROVED;
      case "REJECTED":
        return SYSTEM_MESSAGES.ASSET_REPORT.STATS.REJECTED;
      default:
        return status;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case "DAMAGED":
        return SYSTEM_MESSAGES.ASSET_REPORT.TXT_DAMAGED;
      case "LOST":
        return SYSTEM_MESSAGES.ASSET_REPORT.TXT_LOST;
      default:
        return type;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {SYSTEM_MESSAGES.ASSET_REPORT.TITLE}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.ASSET_REPORT.DESC}
              </p>
            </div>
          </div>

          {/* ── Dashboard Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REPORT.STATS.TOTAL}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-foreground">
                    {reports.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REPORT.STATS.PENDING}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">
                    {reports.filter((r) => r.status === "PENDING").length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REPORT.STATS.APPROVED}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {reports.filter((r) => r.status === "APPROVED").length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REPORT.STATS.REJECTED}
                  </p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {reports.filter((r) => r.status === "REJECTED").length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={SYSTEM_MESSAGES.ASSET_REPORT.SEARCH_PLACEHOLDER}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 h-9 bg-white"
                  onKeyDown={(e) => e.key === "Enter" && fetchReports()}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[140px] h-9 bg-white">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                    <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                    <SelectItem value="REJECTED">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                          className="border-slate-200 text-slate-600 font-bold text-[10px] tracking-widest px-2.5 py-0.5 rounded-full bg-slate-50"
                        >
                          {getIssueTypeLabel(report.issueType)}
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
                            className={`status-badge-pill ${report.statusColor} border-none shadow-sm normal-case`}
                          >
                            {getReportStatusLabel(report.status)}
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
            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>
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
                    className="h-7 w-7"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium px-1">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
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
