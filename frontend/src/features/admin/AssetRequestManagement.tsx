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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
        <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_STATS_TOTAL}
              </p>
              <p className="text-2xl font-bold mt-1 text-foreground">
                {stats.total}
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
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_STATS_PENDING}
              </p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">
                {stats.pending}
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
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_STATS_APPROVED}
              </p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {stats.approved}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_STATS_REJECTED}
              </p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {stats.rejected}
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
              placeholder={
                SYSTEM_MESSAGES.ASSET_REQUEST.SEARCH_ADMIN_PLACEHOLDER
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-9 bg-white"
              onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 bg-white">
                <SelectValue
                  placeholder={SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_STATUS}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{SYSTEM_MESSAGES.LABEL_ALL}</SelectItem>
                <SelectItem value="PENDING">
                  {SYSTEM_MESSAGES.STATUS.PENDING}
                </SelectItem>
                <SelectItem value="APPROVED">
                  {SYSTEM_MESSAGES.STATUS.APPROVED}
                </SelectItem>
                <SelectItem value="REJECTED">
                  {SYSTEM_MESSAGES.STATUS.REJECTED}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {SYSTEM_MESSAGES.STATUS.CANCELLED}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_REQUEST_ID}
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_EMPLOYEE}
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_ASSET_TYPE}
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_PRIORITY}
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_DATE}
                </TableHead>
                <TableHead className="py-3 px-5 text-xs font-semibold text-muted-foreground">
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
                      {SYSTEM_MESSAGES.SYMBOLS.HASH}
                      {r.requestId}
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
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {SYSTEM_MESSAGES.ASSET_REQUEST.MODAL_DETAIL_TITLE}
            </SheetTitle>
            <SheetDescription>
              {selectedRequest
                ? `${SYSTEM_MESSAGES.SYMBOLS.HASH}${selectedRequest.requestId}`
                : ""}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedRequest ? (
            <div className="space-y-6">
              <div className="space-y-4 rounded-lg bg-muted/20 p-4 border border-border">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_STATUS}
                  </span>
                  <Badge className={selectedRequest.statusColor}>
                    {selectedRequest.statusLabel}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_EMPLOYEE}
                  </span>
                  <span className="font-medium">
                    {selectedRequest.requestedBy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_ASSET_TYPE}
                  </span>
                  <span className="font-medium">
                    {selectedRequest.assetType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_PRIORITY}
                  </span>
                  <Badge className={selectedRequest.priorityColor}>
                    {selectedRequest.priorityLabel}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.TABLE_DATE}
                  </span>
                  <span className="text-sm">{selectedRequest.requestedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REASON}
                </h4>
                <div className="bg-muted/10 border border-border p-3 rounded-lg text-sm text-foreground whitespace-pre-wrap">
                  {selectedRequest.reason}
                </div>
              </div>

              {selectedRequest.status === "PENDING" ? (
                user?.id === selectedRequest.requesterUserId ? (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="bg-amber-50 text-amber-600 border border-amber-200 p-3 rounded-md text-sm text-center">
                      {SYSTEM_MESSAGES.ASSET_REQUEST.MSG_SELF_APPROVE_ERROR}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold">
                      {SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_REVIEW_NOTE}
                    </h4>
                    <Textarea
                      placeholder={
                        SYSTEM_MESSAGES.ASSET_REQUEST.PLACEHOLDER_NOTE
                      }
                      value={processNote}
                      onChange={(e) => setProcessNote(e.target.value)}
                      className="resize-none h-24"
                    />
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleProcess("REJECT")}
                        disabled={processing}
                      >
                        {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_REJECT}
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleProcess("APPROVE")}
                        disabled={processing}
                      >
                        {processing && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {SYSTEM_MESSAGES.ASSET_REQUEST.BTN_APPROVE}
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold bg-muted/40 p-2 rounded-t-lg border border-b-0 border-border">
                    {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_PROCESS_HISTORY}
                  </h4>
                  <div className="border border-border rounded-b-lg p-3 space-y-2 text-sm bg-muted/10">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEWED_BY}
                      </span>
                      <span className="font-medium">
                        {selectedRequest.reviewedBy || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEWED_AT}
                      </span>
                      <span>{selectedRequest.reviewedAt || "—"}</span>
                    </div>
                    {selectedRequest.reviewNote && (
                      <div className="pt-2">
                        <span className="text-muted-foreground block mb-1">
                          {SYSTEM_MESSAGES.ASSET_REQUEST.LABEL_REVIEW_NOTE}
                        </span>
                        <div className="bg-background border border-border p-2 rounded whitespace-pre-wrap text-xs">
                          {selectedRequest.reviewNote}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}

export default AssetRequestManagement;
