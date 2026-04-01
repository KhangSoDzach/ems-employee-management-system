import { useState, useCallback, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Search,
  XCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  assetService,
  AssetRequestAdminItem,
  AssetRequestDetail,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useAuth } from "@/contexts/AuthContext";

export function AssetRequestManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AssetRequestAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Sheet Detail State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AssetRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processNote, setProcessNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await assetService.getAllAssetRequests({
        keyword,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page,
        size: PAGE_SIZE,
      });
      setRequests(response.content);

      // We should ideally fetch stats from backend or calculate if we loaded all.
      // For now, let's just do a naive count of the current page to show some numbers
      const pending = response.content.filter(
        (r) => r.status === "PENDING",
      ).length;
      const approved = response.content.filter(
        (r) => r.status === "APPROVED",
      ).length;
      const rejected = response.content.filter(
        (r) => r.status === "REJECTED",
      ).length;
      setStats({
        total: response.totalElements,
        pending: statusFilter === "PENDING" ? response.totalElements : pending,
        approved:
          statusFilter === "APPROVED" ? response.totalElements : approved,
        rejected:
          statusFilter === "REJECTED" ? response.totalElements : rejected,
      });
      setTotalPages(response.totalPages);
    } catch (_error) {
      toast.error(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, page, PAGE_SIZE]);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenDetail = async (id: number) => {
    setIsSheetOpen(true);
    setDetailLoading(true);
    setProcessNote("");
    try {
      const detail = await assetService.getAssetRequestDetailAdmin(id);
      setSelectedRequest(detail);
    } catch (_error) {
      toast.error(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_FETCH_DETAIL_ERROR);
      setIsSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleProcess = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRequest) {
      return;
    }
    setProcessing(true);
    try {
      if (action === "APPROVE") {
        await assetService.approveAssetRequest(selectedRequest.id, {
          note: processNote,
        });
        toast.success(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_APPROVE_SUCCESS);
      } else {
        await assetService.rejectAssetRequest(selectedRequest.id, {
          note: processNote,
        });
        toast.success(SYSTEM_MESSAGES.ASSET_REQUEST.MSG_REJECT_SUCCESS);
      }
      setIsSheetOpen(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          SYSTEM_MESSAGES.ASSET_REQUEST.MSG_PROCESS_ERROR,
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {SYSTEM_MESSAGES.ASSET_REQUEST.TITLE_ADMIN}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {SYSTEM_MESSAGES.ASSET_REQUEST.DESC_ADMIN}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.ASSET_REPORT.STATS.TOTAL}
              </p>
              <p className="text-2xl font-black mt-1 text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.STATUS.PENDING}
              </p>
              <p className="text-2xl font-black mt-1 text-amber-500">
                {stats.pending}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm border-l-4 border-l-emerald-500/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.STATUS.APPROVED}
              </p>
              <p className="text-2xl font-black mt-1 text-emerald-500">
                {stats.approved}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm border-l-4 border-l-rose-500/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {SYSTEM_MESSAGES.STATUS.REJECTED}
              </p>
              <p className="text-2xl font-black mt-1 text-rose-500">
                {stats.rejected}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                SYSTEM_MESSAGES.ASSET_REQUEST.SEARCH_ADMIN_PLACEHOLDER
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-11 bg-background border-border/50 focus-visible:ring-primary rounded-xl font-bold text-sm"
              onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-11 bg-background border-border/50 rounded-xl font-bold text-xs uppercase tracking-widest">
                <SelectValue
                  placeholder={SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_STATUS}
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
                <SelectItem
                  value="CANCELLED"
                  className="font-bold text-xs uppercase tracking-widest"
                >
                  {SYSTEM_MESSAGES.STATUS.CANCELLED}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-border">
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_REQUEST_ID}
                </TableHead>
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_EMPLOYEE}
                </TableHead>
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_ASSET_TYPE}
                </TableHead>
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_PRIORITY}
                </TableHead>
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_DATE}
                </TableHead>
                <TableHead className="h-14 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_STATUS}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : requests.length > 0 ? (
                requests.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => handleOpenDetail(r.id)}
                  >
                    <TableCell className="px-5 py-3 font-medium text-blue-600">
                      #{r.requestId}
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium">
                      {r.employeeName}
                    </TableCell>
                    <TableCell className="px-5 py-3">{r.assetType}</TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className={r.priorityColor}>
                        {r.priorityLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-muted-foreground text-sm">
                      {r.requestedAt}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge className={r.statusColor}>{r.statusLabel}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-48 text-center text-muted-foreground"
                  >
                    {SYSTEM_MESSAGES.ASSET_REQUEST.EMPTY_ADMIN_DESC}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {stats.total > 0 ? page * PAGE_SIZE + 1 : 0}-
            {Math.min((page + 1) * PAGE_SIZE, stats.total)}{" "}
            {SYSTEM_MESSAGES.SYMBOLS.SLASH} {stats.total}{" "}
            {SYSTEM_MESSAGES.ASSET_REQUEST.UNIT_REQUEST}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
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
                size="icon"
                variant="outline"
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

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 gap-0 border-l shadow-2xl overflow-hidden flex flex-col"
        >
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedRequest ? (
            <>
              {/* HEADER */}
              <div className="px-10 pt-20 pb-12 bg-background border-b border-border text-foreground relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <FileCheck className="w-48 h-48 stroke-[0.5] text-primary" />
                </div>

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${selectedRequest.statusColor} border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg`}
                    >
                      {selectedRequest.statusLabel}
                    </Badge>
                    <span className="font-black text-muted-foreground text-sm tracking-tighter uppercase font-mono">
                      #{selectedRequest.requestId}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter leading-none text-foreground uppercase">
                      {SYSTEM_MESSAGES.ASSET_REQUEST.MODAL_DETAIL_TITLE}
                    </h2>
                    <div className="flex items-center gap-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {selectedRequest.requestedBy}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {selectedRequest.requestedAt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-background">
                <div className="grid grid-cols-1 gap-10">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Thông tin yêu cầu
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-8 rounded-[2rem] border border-border/50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Loại tài sản
                        </p>
                        <p className="font-black text-foreground text-lg tracking-tight uppercase">
                          {selectedRequest.assetType}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Ưu tiên
                        </p>
                        <Badge
                          className={`${selectedRequest.priorityColor} border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-sm`}
                        >
                          {selectedRequest.priorityLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REASON}
                    </h4>
                    <div className="bg-muted/10 p-8 rounded-[2.5rem] border-2 border-dashed border-border/50 italic text-sm text-muted-foreground leading-relaxed">
                      "{selectedRequest.reason}"
                    </div>
                  </div>

                  {selectedRequest.status === "PENDING" ? (
                    user?.id === selectedRequest.requesterUserId ? (
                      <div className="p-8 bg-amber-500/5 border-2 border-amber-500/10 rounded-[2.5rem] text-center space-y-3">
                        <Clock className="w-10 h-10 text-amber-500 mx-auto" />
                        <p className="text-sm font-bold text-amber-600">
                          Bạn không thể tự duyệt yêu cầu của bản thân.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 pt-10 border-t">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {
                            SYSTEM_MESSAGES.ASSET_REQUEST
                              .PLACEHOLDER_REVIEW_NOTE
                          }
                        </h4>
                        <Textarea
                          placeholder={
                            SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_NOTE
                          }
                          value={processNote}
                          onChange={(e) => setProcessNote(e.target.value)}
                          className="min-h-32 rounded-[2rem] border-2 border-border focus:border-primary font-medium p-6 bg-muted/30"
                        />
                        <div className="flex gap-4 pt-4">
                          <Button
                            variant="ghost"
                            className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => handleProcess("REJECT")}
                            disabled={processing}
                          >
                            {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_REJECT}
                          </Button>
                          <Button
                            className="flex-1 h-16 bg-emerald-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] gap-3 shadow-xl shadow-emerald-500/20"
                            onClick={() => handleProcess("APPROVE")}
                            disabled={processing}
                          >
                            {processing && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_APPROVE}
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-8 pt-10 border-t">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Lịch sử xử lý
                      </h4>
                      <div className="bg-muted/20 p-8 rounded-[2.5rem] border border-border/50 space-y-6 text-sm">
                        <div className="flex justify-between items-center pb-4 border-b border-border/30">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEWED_BY}
                          </span>
                          <span className="font-black text-foreground">
                            {selectedRequest.reviewedBy || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-border/30">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEWED_AT}
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {selectedRequest.reviewedAt || "—"}
                          </span>
                        </div>
                        {selectedRequest.reviewNote && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">
                              {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEW_NOTE}
                            </span>
                            <div className="bg-background border border-border p-6 rounded-2xl italic text-muted-foreground leading-relaxed">
                              "{selectedRequest.reviewNote}"
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}

export default AssetRequestManagement;
