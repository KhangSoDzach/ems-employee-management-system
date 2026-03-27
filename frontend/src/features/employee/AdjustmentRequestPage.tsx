import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ADJUSTMENT_STATUS_CONFIG,
  ADJUSTMENT_STATUS_OPTIONS,
  ADJUSTMENT_TYPE_CONFIG,
  ADJUSTMENT_TYPE_OPTIONS,
  ALL_LABEL,
  DATE_FORMAT,
  AdjustmentRequest,
  AdjustmentStatus,
  AdjustmentType,
  AuditEntry,
  type AdjustmentFormValues,
} from "./adjustment-request.constants";
import {
  ActiveFilterBadge,
  StatusBadge,
  TypeBadge,
} from "./components/AdjustmentBadges";
import { DetailSheet } from "./components/AdjustmentDetailSheet";
import { CreateRequestModal } from "./components/CreateRequestModal";
import { EditRequestModal } from "./components/EditRequestModal";

import {
  attendanceService,
  type AdjustmentRequestSummary,
  type AdjustmentReason,
  type CreateAdjustmentPayload,
} from "@/services/attendanceService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

// ─── Backend ↔ UI mappers ─────────────────────────────────────────────────────

function mapStatus(s: AdjustmentRequestSummary["status"]): AdjustmentStatus {
  if (s === "APPROVED") {
    return "APPROVED";
  }
  if (s === "REJECTED") {
    return "REJECTED";
  }
  if (s === "RETURNED_TO_EMPLOYEE") {
    return "RETURNED";
  }
  return "PENDING";
}

function deriveType(
  inTime: string | null,
  outTime: string | null,
): AdjustmentType {
  if (inTime && outTime) {
    return "BOTH";
  }
  if (inTime) {
    return "CHECK_IN";
  }
  return "CHECK_OUT";
}

function mapToFrontend(s: AdjustmentRequestSummary): AdjustmentRequest {
  return {
    id: String(s.id),
    dateCreated: new Date(s.createdAt),
    adjustmentDate: new Date(s.requestDate),
    type: deriveType(s.proposedCheckInTime, s.proposedCheckOutTime),
    proposedTimeIn: s.proposedCheckInTime
      ? format(new Date(s.proposedCheckInTime), "HH:mm")
      : undefined,
    proposedTimeOut: s.proposedCheckOutTime
      ? format(new Date(s.proposedCheckOutTime), "HH:mm")
      : undefined,
    status: mapStatus(s.status),
    reason: s.reasonText,
    auditTrail: [],
  };
}

function mapHistoryAction(action: string): AuditEntry["action"] {
  if (action === "APPROVED") {
    return "APPROVED";
  }
  if (action === "REJECTED") {
    return "REJECTED";
  }
  if (action === "RETURNED_TO_EMPLOYEE") {
    return "RETURNED";
  }
  if (action === "RESUBMITTED") {
    return "EDITED";
  }
  return "CREATED";
}

function typeToReason(type: AdjustmentType): AdjustmentReason {
  if (type === "CHECK_IN") {
    return "FORGOT_CHECKIN";
  }
  if (type === "CHECK_OUT") {
    return "FORGOT_CHECKOUT";
  }
  return "OTHER";
}

function toISODateTime(date: Date, time: string): string {
  return `${format(date, "yyyy-MM-dd")}T${time}:00`;
}

function buildPayload(data: AdjustmentFormValues): CreateAdjustmentPayload {
  return {
    requestDate: format(data.adjustmentDate, "yyyy-MM-dd"),
    proposedCheckInTime:
      (data.type === "CHECK_IN" || data.type === "BOTH") && data.timeIn
        ? toISODateTime(data.adjustmentDate, data.timeIn)
        : undefined,
    proposedCheckOutTime:
      (data.type === "CHECK_OUT" || data.type === "BOTH") && data.timeOut
        ? toISODateTime(data.adjustmentDate, data.timeOut)
        : undefined,
    reasonType: typeToReason(data.type),
    reasonText: data.reason,
  };
}

/* ══════════════ EMPTY STATE ══════════════ */
const EmptyState = ({ hasFilter }: { hasFilter: boolean }) => (
  <TableRow>
    <TableCell colSpan={7} className="h-64 text-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {hasFilter
              ? SYSTEM_MESSAGES.ADJUSTMENT.EMPTY_FILTER_TITLE
              : SYSTEM_MESSAGES.ADJUSTMENT.EMPTY_TITLE}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasFilter
              ? SYSTEM_MESSAGES.ADJUSTMENT.EMPTY_FILTER_DESC
              : SYSTEM_MESSAGES.ADJUSTMENT.EMPTY_DESC}
          </p>
        </div>
      </div>
    </TableCell>
  </TableRow>
);

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

/* ══════════════ MAIN PAGE ══════════════ */
export default function AdjustmentRequestPage() {
  const effectiveRole = useEffectiveRole();
  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdjustmentStatus | "ALL">(
    "ALL",
  );
  const [typeFilter, setTypeFilter] = useState<AdjustmentType | "ALL">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<AdjustmentRequest | null>(
    null,
  );
  const [editRequest, setEditRequest] = useState<AdjustmentRequest | null>(
    null,
  );

  // ── Fetch details when opening sheet ───────────────────────────────────────
  useEffect(() => {
    if (!detailRequest || detailRequest.auditTrail.length > 0) {
      return;
    }

    const fetchDetail = async () => {
      try {
        const fullDetail = await attendanceService.getAdjustmentDetail(
          Number(detailRequest.id),
        );
        setDetailRequest((prev) => {
          if (!prev || prev.id !== String(fullDetail.id)) {
            return prev;
          }
          return {
            ...prev,
            auditTrail: fullDetail.history.map((h) => ({
              id: String(h.id),
              action: mapHistoryAction(h.action),
              actor: h.actionByName,
              timestamp: new Date(h.actionAt),
              note: h.comment ?? undefined,
            })),
          };
        });
      } catch {
        toast.error(SYSTEM_MESSAGES.ADJUSTMENT.MSG_FETCH_ERROR);
      }
    };
    fetchDetail();
  }, [detailRequest]);

  // ── Fetch my adjustments ───────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMyAdjustments({
        page,
        size: PAGE_SIZE,
      });
      setRequests(res.content.map(mapToFrontend));
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      toast.error(SYSTEM_MESSAGES.ADJUSTMENT.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  useEffect(() => {
    setPage(0);
  }, [statusFilter, typeFilter]);

  // ── Client-side filters (on current page) ─────────────────────────────────
  const filtered = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (typeFilter === "ALL" || r.type === typeFilter) &&
      (q === "" ||
        r.id.toLowerCase().includes(q) ||
        ADJUSTMENT_TYPE_CONFIG[r.type].label.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q))
    );
  });

  const hasFilter =
    statusFilter !== "ALL" || typeFilter !== "ALL" || searchQuery !== "";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (data: AdjustmentFormValues) => {
    const payload = buildPayload(data);
    await attendanceService.submitAdjustment(payload);
    await fetchRequests();
  };

  const handleEdit = async (id: string, data: AdjustmentFormValues) => {
    const payload = buildPayload(data);
    await attendanceService.resubmitAdjustment(Number(id), payload);
    await fetchRequests();
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSearchQuery("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="page-layout-wrapper">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="page-heading">
                {SYSTEM_MESSAGES.ADJUSTMENT.TITLE}
              </h1>
              <p className="text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.ADJUSTMENT.DESC}
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 h-10 px-5 font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {SYSTEM_MESSAGES.ADJUSTMENT.BTN_CREATE}
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={SYSTEM_MESSAGES.ADJUSTMENT.SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {SYSTEM_MESSAGES.ADJUSTMENT.FILTER_STATUS}
                  {statusFilter !== "ALL" && (
                    <ActiveFilterBadge
                      value={
                        ADJUSTMENT_STATUS_CONFIG[
                          statusFilter as AdjustmentStatus
                        ].label
                      }
                      colorClass={
                        ADJUSTMENT_STATUS_CONFIG[
                          statusFilter as AdjustmentStatus
                        ].filterClass
                      }
                      onClear={() => setStatusFilter("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => setStatusFilter("ALL")}
                  className={cn(
                    "cursor-pointer text-sm",
                    statusFilter === "ALL" && "font-bold text-primary",
                  )}
                >
                  {ALL_LABEL}
                </DropdownMenuItem>
                {ADJUSTMENT_STATUS_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "cursor-pointer",
                      statusFilter === value && "bg-muted font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full inline-block shrink-0",
                          value === "PENDING" && "bg-amber-500",
                          value === "APPROVED" && "bg-emerald-500",
                          value === "REJECTED" && "bg-rose-500",
                          value === "RETURNED" && "bg-orange-500",
                        )}
                      />
                      {cfg.label}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {SYSTEM_MESSAGES.ADJUSTMENT.FILTER_TYPE}
                  {typeFilter !== "ALL" && (
                    <ActiveFilterBadge
                      value={
                        ADJUSTMENT_TYPE_CONFIG[typeFilter as AdjustmentType]
                          .label
                      }
                      colorClass={
                        ADJUSTMENT_TYPE_CONFIG[typeFilter as AdjustmentType]
                          .filterClass
                      }
                      onClear={() => setTypeFilter("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => setTypeFilter("ALL")}
                  className={cn(
                    "cursor-pointer text-sm",
                    typeFilter === "ALL" && "font-bold text-primary",
                  )}
                >
                  {ALL_LABEL}
                </DropdownMenuItem>
                {ADJUSTMENT_TYPE_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={cn(
                      "cursor-pointer",
                      typeFilter === value && "bg-muted font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full inline-block shrink-0",
                          value === "CHECK_IN" && "bg-indigo-500",
                          value === "CHECK_OUT" && "bg-violet-500",
                          value === "BOTH" && "bg-teal-500",
                        )}
                      />
                      {cfg.label}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-sm text-muted-foreground"
                onClick={clearAllFilters}
              >
                {SYSTEM_MESSAGES.ADJUSTMENT.BTN_CLEAR}
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    {[
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_ID,
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_DATE_CREATED,
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_DATE_ADJUSTMENT,
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_TYPE,
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_TIME_PROPOSED,
                      SYSTEM_MESSAGES.ADJUSTMENT.TABLE_STATUS,
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="py-4 font-semibold text-foreground px-6"
                      >
                        {h}
                      </TableHead>
                    ))}
                    <TableHead className="py-4 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <EmptyState hasFilter={hasFilter} />
                  ) : (
                    filtered.map((req) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                        onClick={() => setDetailRequest(req)}
                      >
                        <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary/80">
                          {SYSTEM_MESSAGES.SYMBOLS.HASH}
                          {req.id}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(req.dateCreated, DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(req.adjustmentDate, DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <TypeBadge type={req.type} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-foreground">
                            {req.proposedTimeIn && req.proposedTimeOut
                              ? `${req.proposedTimeIn} – ${req.proposedTimeOut}`
                              : (req.proposedTimeIn ??
                                req.proposedTimeOut ??
                                SYSTEM_MESSAGES.COMMON.EMPTY_VALUE)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell
                          className="py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="cursor-pointer text-sm"
                                onClick={() => setDetailRequest(req)}
                              >
                                {SYSTEM_MESSAGES.ADJUSTMENT.BTN_DETAIL}
                              </DropdownMenuItem>
                              {req.status === "RETURNED" && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm"
                                    onClick={() => setEditRequest(req)}
                                  >
                                    {SYSTEM_MESSAGES.ADJUSTMENT.BTN_EDIT_RESEND}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm text-primary font-medium"
                                    onClick={() => setEditRequest(req)}
                                  >
                                    {SYSTEM_MESSAGES.ADJUSTMENT.BTN_RESEND}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {totalElements > 0 ? page * PAGE_SIZE + 1 : 0}-
                {Math.min((page + 1) * PAGE_SIZE, totalElements)}{" "}
                {SYSTEM_MESSAGES.SYMBOLS.SLASH} {totalElements}{" "}
                {SYSTEM_MESSAGES.ADJUSTMENT.SUMMARY_UNIT}
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

      <CreateRequestModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
      <DetailSheet
        request={detailRequest}
        open={!!detailRequest}
        onClose={() => setDetailRequest(null)}
      />
      <EditRequestModal
        request={editRequest}
        open={!!editRequest}
        onClose={() => setEditRequest(null)}
        onSubmit={handleEdit}
      />
    </SidebarProvider>
  );
}
