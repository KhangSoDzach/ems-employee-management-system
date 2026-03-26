import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  User,
  Package,
  Filter,
  Eye,
  MoreHorizontal,
  ShieldAlert,
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
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
  ASSET_CONDITION_LABELS,
  AssetCondition,
  ASSET_STATUS_LABELS,
  AssetStatus,
} from "@/services/assetService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

export default function AssetReportManagement() {
  const effectiveRole = useEffectiveRole();

  const [reports, setReports] = useState<AdminIncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const [selectedReport, setSelectedReport] =
    useState<IncidentReportDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processNote, setProcessNote] = useState("");
  const processingRef = useRef(false); // guard against StrictMode double-invoke

  const fetchReports = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const data = await assetService.getAllReports(
          {
            keyword: keyword || undefined,
            status: status || undefined,
            page: 0,
            size: 100,
          },
          signal,
        );
        if (signal?.aborted) {
          return;
        }
        setReports(data.content);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 403) {
          toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_FETCH_LIST_ERROR);
        }
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [keyword, status],
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
      setProcessNote("");
      setDetailOpen(true);
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_FETCH_DETAIL_ERROR);
    }
  };

  const handleProcess = async (type: "APPROVE" | "REJECT") => {
    if (!selectedReport) {
      return;
    }
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;
    setProcessing(true);
    try {
      if (type === "APPROVE") {
        await assetService.approveReport(selectedReport.id, processNote);
        toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_APPROVE_SUCCESS, {
          description: SYSTEM_MESSAGES.ASSET_REPORT.MSG_APPROVE_DESC,
          icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />,
        });
      } else {
        await assetService.rejectReport(selectedReport.id, processNote);
        toast.success(SYSTEM_MESSAGES.ASSET_REPORT.MSG_REJECT_SUCCESS);
      }
      setDetailOpen(false);
      fetchReports();
    } catch (error) {
      toast.error(SYSTEM_MESSAGES.ASSET_REPORT.MSG_PROCESS_ERROR, {
        description:
          (error as any).response?.data?.message ||
          SYSTEM_MESSAGES.ASSET_REPORT.MSG_TRY_AGAIN,
      });
    } finally {
      setProcessing(false);
      processingRef.current = false;
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
      <AppSidebar variant="inset" role={effectiveRole} />
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

            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white border-b border-slate-100">
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.CODE}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.EMPLOYEE}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.ASSET}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.ISSUE_TYPE}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.REPORT_DATE}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    {SYSTEM_MESSAGES.ASSET_REPORT.TABLE_COLS.STATUS}
                  </TableHead>
                  <TableHead className="h-14 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
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
                        className="px-8 py-6 h-20 bg-slate-50/20"
                      ></TableCell>
                    </TableRow>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group"
                    >
                      <TableCell className="px-8 py-6">
                        <span className="font-black text-blue-600 text-sm tracking-tighter">
                          {SYSTEM_MESSAGES.ASSET_REPORT.TXT_HASH}
                          {report.reportId}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                            {report.employeeName.split(" ").pop()?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 text-[13px] tracking-tight">
                            {report.employeeName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-1">
                            {report.asset}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-600 font-bold text-[10px] tracking-widest px-2.5 py-0.5 rounded-full bg-slate-50"
                        >
                          {getIssueTypeLabel(report.issueType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-tighter">
                          <Calendar className="w-3.5 h-3.5 opacity-40" />
                          {report.reportedAt}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="flex justify-center">
                          <Badge
                            className={`status-badge-pill ${report.statusColor} border-none shadow-sm normal-case`}
                          >
                            {getReportStatusLabel(report.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
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
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-slate-50 rounded-4xl flex items-center justify-center border-2 border-dashed border-slate-200 mb-2">
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

      {/* ── Report Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          {selectedReport && (
            <>
              <div className="px-10 pt-10 pb-8 bg-linear-to-br from-slate-900 to-black text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <AlertTriangle className="w-40 h-40 stroke-1" />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${selectedReport?.statusColor} border-none px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-lg`}
                      >
                        {selectedReport?.statusLabel}
                      </Badge>
                      <span className="font-black text-slate-400 text-sm tracking-tighter uppercase">
                        {SYSTEM_MESSAGES.ASSET_REPORT.TXT_HASH}
                        {selectedReport?.reportId}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">
                      {SYSTEM_MESSAGES.ASSET_REPORT.DETAIL_TITLE}
                    </h2>
                    <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {selectedReport?.reportedBy}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedReport?.reportedAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_ASSET_INFO}
                      </h4>
                      <div className="bg-slate-50/50 p-5 rounded-3xl border-2 border-slate-50 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_NAME}
                            </p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">
                              {selectedReport?.asset}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_STATUS}
                            </p>
                            <p className="text-xs font-black text-blue-600 tracking-tighter uppercase whitespace-nowrap">
                              {ASSET_STATUS_LABELS[
                                selectedReport?.assetStatus as AssetStatus
                              ] || selectedReport?.assetStatus}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_CODE}
                            </p>
                            <p className="text-sm font-black text-slate-800 tracking-tighter">
                              {selectedReport?.assetCode}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border-none shadow-md shadow-blue-600/20"
                          >
                            {selectedReport?.assetTag}
                          </Badge>
                        </div>

                        {/* AC-05: Show current state before approving */}
                        {(selectedReport?.status === "PENDING" ||
                          selectedReport?.status === "APPROVED") && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {
                                  SYSTEM_MESSAGES.ASSET_REPORT
                                    .LABEL_CURRENT_CONDITION
                                }
                              </p>
                              <p className="text-sm font-black text-slate-800 tracking-tighter">
                                {ASSET_CONDITION_LABELS[
                                  selectedReport?.assetCondition as AssetCondition
                                ] || selectedReport?.assetCondition}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                {selectedReport?.status === "PENDING"
                                  ? SYSTEM_MESSAGES.ASSET_REPORT
                                      .LABEL_TARGET_UPDATE
                                  : SYSTEM_MESSAGES.ASSET_REPORT
                                      .LABEL_UPDATED_TO}
                              </p>
                              <p className="text-sm font-black text-rose-600 tracking-tighter">
                                {selectedReport?.incidentType === "DAMAGED"
                                  ? SYSTEM_MESSAGES.ASSET_REPORT.TXT_DAMAGED
                                  : SYSTEM_MESSAGES.ASSET_REPORT.TXT_LOST}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_REPORT_CONTENT}
                      </h4>
                      <div className="bg-rose-50/10 p-5 rounded-3xl border-2 border-rose-100/50 space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                            {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ISSUE_TYPE}
                          </p>
                          <p className="text-base font-black text-slate-900 tracking-tight">
                            {selectedReport?.incidentTypeLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_DETAIL_DESC}
                          </p>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                            {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                            {selectedReport?.description}
                            {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_EVIDENCE}
                      </h4>
                      {selectedReport?.attachmentUrl ? (
                        <div className="relative group rounded-3xl overflow-hidden border-4 border-slate-50 shadow-lg cursor-zoom-in">
                          <img
                            src={selectedReport?.attachmentUrl}
                            alt="Evidence"
                            className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="text-white w-8 h-8" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
                          <FileText className="w-10 h-10 text-slate-200 mb-2" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {SYSTEM_MESSAGES.ASSET_REPORT.TXT_NO_ATTACHMENT}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Processing Info Context */}
                    {selectedReport?.status !== "PENDING" && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                          {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_PROCESS_INFO}
                        </h4>
                        <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl shadow-slate-900/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESSOR}
                              </p>
                              <p className="text-sm font-black tracking-tight">
                                {selectedReport?.processedBy}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {
                                  SYSTEM_MESSAGES.ASSET_REPORT
                                    .LABEL_PROCESS_TIME
                                }
                              </p>
                              <p className="text-[11px] font-bold text-slate-300">
                                {selectedReport?.processedAt}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESS_NOTE}
                            </p>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                              {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                              {selectedReport?.processNote ||
                                SYSTEM_MESSAGES.ASSET_REPORT.TXT_NO_NOTE}
                              {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Form */}
                {selectedReport?.status === "PENDING" && (
                  <div className="mt-12 pt-10 border-t-2 border-slate-100 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_FEEDBACK_NOTE}
                      </label>
                      <Textarea
                        placeholder={
                          SYSTEM_MESSAGES.ASSET_REPORT.PLACEHOLDER_FEEDBACK
                        }
                        className="resize-none h-32 text-sm border-slate-200 focus:ring-blue-600/20 rounded-2xl transition-all font-bold text-slate-800 placeholder:text-slate-300 bg-slate-50/50 border-2"
                        value={processNote}
                        onChange={(e) => setProcessNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                {selectedReport?.status === "PENDING" ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[10px] text-rose-500 border-none bg-rose-50 hover:bg-rose-500 hover:text-white rounded-2xl shadow-sm transition-all"
                      onClick={() => handleProcess("REJECT")}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {SYSTEM_MESSAGES.ASSET_REPORT.BTN_REJECT}
                    </Button>
                    <Button
                      className="flex-2 h-14 font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-600 hover:bg-black text-white shadow-2xl shadow-emerald-600/20 active:scale-[0.98] transition-all rounded-2xl gap-3"
                      onClick={() => handleProcess("APPROVE")}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <BadgeCheck className="w-4 h-4 text-white" />
                      )}
                      {SYSTEM_MESSAGES.ASSET_REPORT.BTN_APPROVE}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-14 font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 hover:bg-slate-100 rounded-2xl"
                    onClick={() => setDetailOpen(false)}
                  >
                    {SYSTEM_MESSAGES.ASSET_REPORT.BTN_CLOSE_DETAIL}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
