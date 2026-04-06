import React, { useState, useEffect, useCallback } from "react";
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
  SlidersHorizontal,
  X,
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
  type AdjustmentRequest,
  type AuditEntry,
  ADJUSTMENT_STATUS_CONFIG,
  ADJUSTMENT_STATUS_OPTIONS,
  type AdjustmentType,
} from "@/constants/adjustment-request";
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
    currentApprovalLevel: s.currentApprovalLevel,
    maxApprovalLevel: s.maxApprovalLevel,
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

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

const ApproveAdjustmentRequest: React.FC = () => {
  const [openReview, setOpenReview] = useState(false);
  const [detailRequest, setDetailRequest] = useState<AdjustmentRequest | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(0);

  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch pending adjustments ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large batch to support client-side filtering/pagination
      const res = await attendanceService.getPendingAdjustments({
        page: 0,
        size: 1000,
      });
      setRequests(res.content.map(mapToFrontend));
    } catch {
      toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter & Paginate ──────────────────────────────────────────────────────
  const filtered = requests.filter((row) => {
    const actor = row.auditTrail[0]?.actor?.toLowerCase() || "";
    const matchesSearch =
      searchQuery === "" ||
      actor.includes(searchQuery.toLowerCase()) ||
      row.id.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING"
        ? row.status === "PENDING"
        : row.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalElementsFiltered = filtered.length;
  const totalPagesFiltered = Math.ceil(totalElementsFiltered / PAGE_SIZE);
  const paginatedData = filtered.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const handleRowClick = (req: AdjustmentRequest) => {
    setDetailRequest(req);
    setOpenReview(true);
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const updateRequestStatus = (
    id: string,
    status: AdjustmentRequest["status"],
  ) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    setDetailRequest((prev) => (prev?.id === id ? { ...prev, status } : prev));
  };

  // ── Approval actions ──────────────────────────────────────────────────────
  const handleApprove = async (id: string, reason: string) => {
    await attendanceService.approveAdjustment(Number(id), { reason });
    updateRequestStatus(id, "APPROVED");
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_APPROVE_SUCCESS);
  };

  const handleReject = async (id: string, reason: string) => {
    await attendanceService.rejectAdjustment(Number(id), { reason });
    updateRequestStatus(id, "REJECTED");
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_REJECT_SUCCESS);
  };

  const handleReturn = async (id: string, reason: string) => {
    await attendanceService.returnAdjustment(Number(id), { reason });
    updateRequestStatus(id, "RETURNED");
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_RETURN_SUCCESS);
  };

  return (
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative w-full sm:w-auto sm:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={SYSTEM_MESSAGES.MGMT_ADJ.SEARCH_PLACEHOLDER}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full text-sm border-border focus:border-primary focus:ring-primary shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 gap-3 text-sm border-border shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-slate-700">
                  {SYSTEM_MESSAGES.MGMT_ADJ.FILTER_STATUS}
                </span>
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
            <DropdownMenuContent align="start" className="w-48 p-1">
              <DropdownMenuItem
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "cursor-pointer text-sm",
                  statusFilter === "ALL" && "bg-muted font-bold text-primary",
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
                    statusFilter === value
                      ? "bg-muted font-medium"
                      : "hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-2.5 py-1">
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
              className="h-10 text-sm text-slate-500 hover:text-primary transition-colors hover:bg-transparent"
              onClick={clearAllFilters}
            >
              {SYSTEM_MESSAGES.MGMT_ADJ.BTN_CLEAR_FILTER}
            </Button>
          )}
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
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    {SYSTEM_MESSAGES.MGMT_ADJ.EMPTY_DATA}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
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
                      <div className="flex flex-col">
                        <StatusBadge status={row.status} />
                        {row.status === "PENDING" &&
                          row.currentApprovalLevel &&
                          row.maxApprovalLevel && (
                            <span className="text-xs text-muted-foreground mt-1">
                              {SYSTEM_MESSAGES.SYMBOLS.LEVEL}{" "}
                              {row.currentApprovalLevel}/{row.maxApprovalLevel}
                            </span>
                          )}
                      </div>
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
            {SYSTEM_MESSAGES.MGMT_ADJ.SUMMARY_TOTAL} {totalElementsFiltered}{" "}
            {SYSTEM_MESSAGES.MGMT_ADJ.SUMMARY_UNIT}
          </span>
          {totalPagesFiltered > 1 && (
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
              <span className="text-sm font-medium">
                {page + 1} {SYSTEM_MESSAGES.SYMBOLS.SLASH} {totalPagesFiltered}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                disabled={page >= totalPagesFiltered - 1}
                onClick={() =>
                  setPage((p) => Math.min(totalPagesFiltered - 1, p + 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ReviewAdjustmentSheet
        open={openReview}
        onOpenChange={setOpenReview}
        request={detailRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
      />
    </main>
  );
};

export default ApproveAdjustmentRequest;
