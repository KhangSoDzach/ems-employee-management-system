import React, { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReviewAdjustmentSheet } from "./components/ReviewAdjustmentSheet";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Download,
  SlidersHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DATE_FORMAT,
  AdjustmentRequest,
  type AuditEntry,
  ADJUSTMENT_STATUS_CONFIG,
  ADJUSTMENT_STATUS_OPTIONS,
  type AdjustmentType,
} from "../employee/adjustment-request.constants";
import {
  StatusBadge,
  TypeBadge,
  ActiveFilterBadge,
} from "../employee/components/AdjustmentBadges";
import { cn } from "@/lib/utils";
import { SYSTEM_MESSAGES } from "@/constants/messages";

import {
  attendanceService,
  type AdjustmentRequestSummary,
} from "@/services/attendanceService";

// ── Mapper ────────────────────────────────────────────────────────────────────
function deriveType(inT: string | null, outT: string | null): AdjustmentType {
  if (inT && outT) {
    return "BOTH";
  }
  if (inT) {
    return "CHECK_IN";
  }
  return "CHECK_OUT";
}

function mapStatus(s: AdjustmentRequestSummary["status"]) {
  if (s === "APPROVED") {
    return "APPROVED" as const;
  }
  if (s === "REJECTED") {
    return "REJECTED" as const;
  }
  if (s === "RETURNED_TO_EMPLOYEE") {
    return "RETURNED" as const;
  }
  return "PENDING" as const;
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
    auditTrail: [
      {
        id: "0",
        action: "CREATED",
        actor: s.employeeName,
        timestamp: new Date(s.createdAt),
      },
    ],
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

const PAGE_SIZE = 10;

const ApproveAdjustmentRequest: React.FC = () => {
  const [openReview, setOpenReview] = useState(false);
  const [detailRequest, setDetailRequest] = useState<AdjustmentRequest | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(0);

  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fetch pending adjustments ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getPendingAdjustments({
        page,
        size: PAGE_SIZE,
      });
      setRequests(res.content.map(mapToFrontend));
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Fetch details when opening review sheet ──────────────────────────────
  useEffect(() => {
    if (!detailRequest || detailRequest.auditTrail.length > 1) {
      return;
    } // already has more than initial

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
        toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR);
      }
    };
    fetchDetail();
  }, [detailRequest]);

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (q === "" ||
        r.id.includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.auditTrail[0]?.actor?.toLowerCase().includes(q))
    );
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const handleRowClick = (req: AdjustmentRequest) => {
    setDetailRequest(req);
    setOpenReview(true);
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  // ── Approval actions ──────────────────────────────────────────────────────
  const handleApprove = async (id: string, reason: string) => {
    await attendanceService.approveAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_APPROVE_SUCCESS);
    await fetchData();
  };

  const handleReject = async (id: string, reason: string) => {
    await attendanceService.rejectAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_REJECT_SUCCESS);
    await fetchData();
  };

  const handleReturn = async (id: string, reason: string) => {
    await attendanceService.returnAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_RETURN_SUCCESS);
    await fetchData();
  };

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="page-heading">{SYSTEM_MESSAGES.MGMT_ADJ.TITLE}</h1>
              <p className="text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.MGMT_ADJ.DESC}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 pl-1">
                {SYSTEM_MESSAGES.MGMT_ADJ.PENDING_STATS_LABEL}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-foreground">
                  {pendingCount}
                </span>
                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 min-w-[180px] w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={SYSTEM_MESSAGES.MGMT_ADJ.SEARCH_PLACEHOLDER}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full text-sm"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {SYSTEM_MESSAGES.MGMT_ADJ.FILTER_STATUS}
                    {statusFilter !== "ALL" && (
                      <ActiveFilterBadge
                        value={
                          ADJUSTMENT_STATUS_CONFIG[
                            statusFilter as keyof typeof ADJUSTMENT_STATUS_CONFIG
                          ]?.label
                        }
                        colorClass={
                          ADJUSTMENT_STATUS_CONFIG[
                            statusFilter as keyof typeof ADJUSTMENT_STATUS_CONFIG
                          ]?.filterClass
                        }
                        onClear={() => setStatusFilter("ALL")}
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
                    {SYSTEM_MESSAGES.LABEL_ALL}
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

              {(statusFilter !== "ALL" || searchQuery !== "") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-sm text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  {SYSTEM_MESSAGES.MGMT_ADJ.BTN_CLEAR_FILTER}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-9 font-medium">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                {SYSTEM_MESSAGES.MGMT_ADJ.BTN_CUSTOM_DATE}
              </Button>
              <Button size="sm" className="h-9 font-medium shadow-sm">
                <Download className="mr-2 h-4 w-4" />
                {SYSTEM_MESSAGES.MGMT_ADJ.BTN_EXPORT}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="card-soft mt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_EMP}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_ADJ_DATE}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_TYPE}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_STATUS}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6 text-right">
                      {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_ACTIONS}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-48 text-center text-muted-foreground"
                      >
                        {SYSTEM_MESSAGES.MGMT_ADJ.EMPTY_DATA}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                        onClick={() => handleRowClick(row)}
                      >
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarImage src={undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                                {row.auditTrail[0]?.actor?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground">
                                {row.auditTrail[0]?.actor ||
                                  SYSTEM_MESSAGES.STATUS.UNKNOWN}
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {SYSTEM_MESSAGES.SYMBOLS.HASH}
                                {row.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(row.adjustmentDate, DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <TypeBadge type={row.type} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(row.status === "PENDING" ||
                              row.status === "RETURNED") && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 shadow-sm tracking-wide text-xs"
                                  onClick={() => handleRowClick(row)}
                                >
                                  {SYSTEM_MESSAGES.MGMT_ADJ.BTN_APPROVE}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 shadow-sm font-medium tracking-wide text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                  onClick={() => handleRowClick(row)}
                                >
                                  {SYSTEM_MESSAGES.MGMT_ADJ.BTN_REJECT}
                                </Button>
                              </>
                            )}
                            {row.status !== "PENDING" &&
                              row.status !== "RETURNED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 font-medium text-muted-foreground"
                                  onClick={() => handleRowClick(row)}
                                >
                                  {SYSTEM_MESSAGES.MGMT_ADJ.BTN_DETAIL}
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {SYSTEM_MESSAGES.MGMT_ADJ.SUMMARY_TOTAL} {totalElements}{" "}
                {SYSTEM_MESSAGES.MGMT_ADJ.SUMMARY_UNIT}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>
                    {page + 1} {SYSTEM_MESSAGES.SYMBOLS.SLASH} {totalPages}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>

      <ReviewAdjustmentSheet
        open={openReview}
        onOpenChange={setOpenReview}
        request={detailRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
      />
    </SidebarProvider>
  );
};

export default ApproveAdjustmentRequest;
