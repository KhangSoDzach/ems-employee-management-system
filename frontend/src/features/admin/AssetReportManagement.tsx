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
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import { useAuth } from "@/contexts/AuthContext";

export default function AssetReportManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminIncidentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const [selectedReport, setSelectedReport] =
    useState<IncidentReportDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processNote, setProcessNote] = useState("");
  const processingRef = useRef(false);

  const [page, setPage] = useState(0);
  const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const paginatedItems = reports.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

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
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.ASSET_REPORT.STATS.TOTAL}
              </p>
              <p className="text-2xl font-black mt-1 text-foreground">
                {reports.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <FileCheck className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.ASSET_REPORT.STATS.PENDING}
              </p>
              <p className="text-2xl font-black mt-1 text-amber-500">
                {reports.filter((r) => r.status === "PENDING").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm border-l-4 border-l-emerald-500/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.ASSET_REPORT.STATS.APPROVED}
              </p>
              <p className="text-2xl font-black mt-1 text-emerald-500">
                {reports.filter((r) => r.status === "APPROVED").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm border-l-4 border-l-rose-500/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.ASSET_REPORT.STATS.REJECTED}
              </p>
              <p className="text-2xl font-black mt-1 text-rose-500">
                {reports.filter((r) => r.status === "REJECTED").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500">
              <XCircle className="w-5 h-5 font-black" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={SYSTEM_MESSAGES.ASSET_REPORT.SEARCH_PLACEHOLDER}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-11 bg-background border-border/50 focus-visible:ring-primary rounded-xl font-bold text-sm"
              onKeyDown={(e) => e.key === "Enter" && fetchReports()}
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] h-11 bg-background border-border/50 rounded-xl font-bold text-xs uppercase tracking-widest">
                <SelectValue
                  placeholder={SYSTEM_MESSAGES.ASSET_REPORT.PLACEHOLDER_STATUS}
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem
                  value="ALL"
                  className="font-bold text-xs uppercase tracking-widest"
                >
                  {SYSTEM_MESSAGES.LABEL_ALL}
                </SelectItem>
                <SelectItem
                  value="PENDING"
                  className="font-bold text-xs uppercase tracking-widest"
                >
                  {SYSTEM_MESSAGES.STATUS.PENDING}
                </SelectItem>
                <SelectItem
                  value="APPROVED"
                  className="font-bold text-xs uppercase tracking-widest"
                >
                  {SYSTEM_MESSAGES.STATUS.APPROVED}
                </SelectItem>
                <SelectItem
                  value="REJECTED"
                  className="font-bold text-xs uppercase tracking-widest"
                >
                  {SYSTEM_MESSAGES.STATUS.REJECTED}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-border">
              <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
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
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((report) => (
                <TableRow
                  key={report.id}
                  onClick={() => handleViewDetail(report.id)}
                  className="group hover:bg-muted/50 transition-all border-b border-border/40 cursor-pointer"
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
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                        >
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
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
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Report Detail Sheet ── */}
      <Sheet open={detailOpen} onOpenChange={(v) => !v && setDetailOpen(false)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 gap-0 border-l shadow-2xl overflow-hidden flex flex-col"
        >
          {selectedReport && (
            <>
              <div className="px-10 pt-20 pb-12 bg-background border-b border-border text-foreground relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <AlertTriangle className="w-48 h-48 stroke-[0.5] text-primary" />
                </div>

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${selectedReport?.statusColor} border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg`}
                    >
                      {selectedReport?.statusLabel}
                    </Badge>
                    <span className="font-black text-muted-foreground text-sm tracking-tighter uppercase font-mono">
                      {SYSTEM_MESSAGES.ASSET_REPORT.TXT_HASH}
                      {selectedReport?.reportId}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter leading-none text-foreground uppercase">
                      {SYSTEM_MESSAGES.ASSET_REPORT.DETAIL_TITLE}
                    </h2>
                    <div className="flex items-center gap-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {selectedReport?.reportedBy}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {selectedReport?.reportedAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-background">
                <div className="grid grid-cols-1 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_ASSET_INFO}
                      </h4>
                      <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_NAME}
                            </p>
                            <p className="text-xl font-black text-foreground tracking-tighter">
                              {selectedReport?.asset}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_STATUS}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-black text-blue-600 border-blue-500/20 bg-blue-500/10 tracking-widest uppercase"
                            >
                              {ASSET_STATUS_LABELS[
                                selectedReport?.assetStatus?.toUpperCase() as AssetStatus
                              ] || selectedReport?.assetStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_CODE}
                            </p>
                            <p className="font-bold text-foreground font-mono">
                              {selectedReport?.assetCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ASSET_TAG}
                            </p>
                            <Badge className="bg-slate-900 text-white font-mono text-[10px]">
                              {selectedReport?.assetTag}
                            </Badge>
                          </div>
                        </div>

                        {(selectedReport?.status === "PENDING" ||
                          selectedReport?.status === "APPROVED") && (
                          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/30">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                {
                                  SYSTEM_MESSAGES.ASSET_REPORT
                                    .LABEL_CURRENT_CONDITION
                                }
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                {ASSET_CONDITION_LABELS[
                                  selectedReport?.assetCondition?.toUpperCase() as AssetCondition
                                ] || selectedReport?.assetCondition}
                              </p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                {selectedReport?.status === "PENDING"
                                  ? SYSTEM_MESSAGES.ASSET_REPORT
                                      .LABEL_TARGET_UPDATE
                                  : SYSTEM_MESSAGES.ASSET_REPORT
                                      .LABEL_UPDATED_TO}
                              </p>
                              <p className="text-sm font-black text-rose-600">
                                {selectedReport?.incidentType === "DAMAGED"
                                  ? SYSTEM_MESSAGES.ASSET_REPORT.TXT_DAMAGED
                                  : SYSTEM_MESSAGES.ASSET_REPORT.TXT_LOST}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_REPORT_CONTENT}
                      </h4>
                      <div className="bg-rose-500/5 p-6 rounded-3xl border border-rose-500/10 space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                            {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_ISSUE_TYPE}
                          </p>
                          <p className="text-lg font-black text-foreground tracking-tight">
                            {getIssueTypeLabel(selectedReport?.incidentType)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                            {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_DETAIL_DESC}
                          </p>
                          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-border shadow-inner-sm">
                            <p className="text-sm font-bold text-muted-foreground italic leading-relaxed">
                              {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                              {selectedReport?.description}
                              {SYSTEM_MESSAGES.ASSET_REPORT.TXT_QUOTE}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_EVIDENCE}
                      </h4>
                      {selectedReport?.attachmentUrl ? (
                        <div className="aspect-video relative group rounded-3xl overflow-hidden border-4 border-muted shadow-lg bg-muted">
                          <img
                            src={selectedReport?.attachmentUrl}
                            alt="Evidence"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="text-white w-10 h-10" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center bg-muted/20 text-muted-foreground/30 gap-3">
                          <FileText className="w-10 h-10" />
                          <p className="text-[10px] font-black uppercase tracking-widest">
                            {SYSTEM_MESSAGES.ASSET_REPORT.TXT_NO_ATTACHMENT}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedReport?.status !== "PENDING" && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                          {SYSTEM_MESSAGES.ASSET_REPORT.SECTION_PROCESS_INFO}
                        </h4>
                        <div className="bg-slate-900 dark:bg-slate-800 text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-black">
                                {selectedReport?.processedBy
                                  ?.split(" ")
                                  .pop()
                                  ?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                                  {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_PROCESSOR}
                                </p>
                                <p className="text-sm font-black tracking-tight">
                                  {selectedReport?.processedBy}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                                {
                                  SYSTEM_MESSAGES.ASSET_REPORT
                                    .LABEL_PROCESS_TIME
                                }
                              </p>
                              <p className="text-[11px] font-bold text-slate-400">
                                {selectedReport?.processedAt}
                              </p>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
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

                    {selectedReport?.status === "PENDING" &&
                      selectedReport?.requesterUserId !== user?.id && (
                        <div className="space-y-4 pt-10 border-t-2 border-border/50">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {SYSTEM_MESSAGES.ASSET_REPORT.LABEL_FEEDBACK_NOTE}
                            </label>
                            <Textarea
                              placeholder={
                                SYSTEM_MESSAGES.ASSET_REPORT
                                  .PLACEHOLDER_FEEDBACK
                              }
                              className="resize-none h-40 text-sm border-2 border-border focus-visible:ring-primary/20 rounded-2xl font-bold bg-muted/30"
                              value={processNote}
                              onChange={(e) => setProcessNote(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="px-10 py-8 bg-muted/20 border-t border-border flex gap-4">
                {selectedReport?.status === "PENDING" ? (
                  selectedReport?.requesterUserId === user?.id ? (
                    <div className="w-full bg-amber-50 text-amber-600 border border-amber-200 p-4 rounded-xl text-sm font-semibold text-center flex items-center justify-center">
                      {SYSTEM_MESSAGES.ASSET_REPORT.MSG_OWN_REPORT}
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 h-16 font-black uppercase tracking-[0.2em] text-[10px] text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                        onClick={() => handleProcess("REJECT")}
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {SYSTEM_MESSAGES.ASSET_REPORT.BTN_REJECT}
                      </Button>
                      <Button
                        className="flex-2 h-16 font-black uppercase tracking-[0.2em] text-[10px] bg-emerald-600 hover:bg-black text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all rounded-2xl gap-3"
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
                  )
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full h-16 font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:bg-muted rounded-2xl"
                    onClick={() => setDetailOpen(false)}
                  >
                    {SYSTEM_MESSAGES.ASSET_REPORT.BTN_CLOSE_DETAIL}
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
