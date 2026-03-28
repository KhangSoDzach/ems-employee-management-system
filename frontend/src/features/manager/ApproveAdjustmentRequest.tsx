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
import { Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DATE_FORMAT,
  AdjustmentRequest,
  type AuditEntry,
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
import {
  employeeService,
  type EmployeeResponse,
} from "@/services/employeeService";

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

function mapSummaryToAdjustmentRequest(
  summary: AdjustmentRequestSummary,
  empList: EmployeeResponse[] = [],
): AdjustmentRequest {
  const employeeData = empList.find((e) => e.id === summary.employeeId);
  return {
    id: String(summary.id),
    employeeName: summary.employeeName ?? "Nhân viên",
    employeeCode: employeeData?.employeeCode,
    department: employeeData?.department ?? "-",
    dateCreated: new Date(summary.createdAt),
    adjustmentDate: new Date(summary.requestDate),
    type: deriveType(summary.proposedCheckInTime, summary.proposedCheckOutTime),
    proposedTimeIn: summary.proposedCheckInTime
      ? format(new Date(summary.proposedCheckInTime), "HH:mm")
      : undefined,
    proposedTimeOut: summary.proposedCheckOutTime
      ? format(new Date(summary.proposedCheckOutTime), "HH:mm")
      : undefined,
    status: mapStatus(summary.status),
    reason: summary.reasonText,
    auditTrail: [
      {
        id: "0",
        action: "CREATED",
        actor: summary.employeeName,
        timestamp: new Date(summary.createdAt),
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
  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, adjRes] = await Promise.all([
        employeeService.getAllEmployees({ page: 0, size: 1000 }),
        attendanceService.getPendingAdjustments({ page: 0, size: 1000 }),
      ]);

      const allEmps = empRes.content;
      setRequests(
        adjRes.content.map((s) => mapSummaryToAdjustmentRequest(s, allEmps)),
      );
    } catch (_err: any) {
      toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // ── Filter & Paginate ──────────────────────────────────────────────────────
  const filtered = requests.filter((row) => {
    const actor = row.employeeName?.toLowerCase() || "";
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

  // ── Approval actions ──────────────────────────────────────────────────────
  const handleApprove = async (id: string, reason: string) => {
    await attendanceService.approveAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_APPROVE_SUCCESS);
    await fetchAdjustments();
  };

  const handleReject = async (id: string, reason: string) => {
    await attendanceService.rejectAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_REJECT_SUCCESS);
    await fetchAdjustments();
  };

  const handleReturn = async (id: string, reason: string) => {
    await attendanceService.returnAdjustment(Number(id), { reason });
    toast.success(SYSTEM_MESSAGES.MGMT_ADJ.MSG_RETURN_SUCCESS);
    await fetchAdjustments();
  };

  return (
    <>
      <main className="flex-1 p-6 space-y-6 bg-slate-50/50">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="page-heading">
              {SYSTEM_MESSAGES.APPROVE.ADJUSTMENT_TITLE}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {SYSTEM_MESSAGES.MGMT_ADJ.DESC}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-slate-200">
              {SYSTEM_MESSAGES.MGMT_ADJ.BTN_EXPORT}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">
              {pendingCount} {SYSTEM_MESSAGES.MGMT_ADJ.PENDING_STATS_LABEL}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-1">
            <ActiveFilterBadge
              value="ALL"
              colorClass="bg-slate-100 text-slate-700"
              isActive={statusFilter === "ALL"}
              onClick={() => setStatusFilter("ALL")}
              onClear={() => setStatusFilter("ALL")}
            />
            <ActiveFilterBadge
              value="PENDING"
              colorClass="bg-yellow-100 text-yellow-800"
              isActive={statusFilter === "PENDING"}
              onClick={() => setStatusFilter("PENDING")}
              onClear={() => setStatusFilter("ALL")}
            />
            {ADJUSTMENT_STATUS_OPTIONS.filter((o) => o[0] !== "PENDING").map(
              ([val, cfg]) => (
                <ActiveFilterBadge
                  key={val}
                  value={val}
                  colorClass={cfg.filterClass}
                  isActive={statusFilter === val}
                  onClick={() => setStatusFilter(val)}
                  onClear={() => setStatusFilter("ALL")}
                />
              ),
            )}
          </div>
        </div>

        {/* Search Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Table Search Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={SYSTEM_MESSAGES.MGMT_ADJ.SEARCH_PLACEHOLDER}
                className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-primary/20 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {(searchQuery || statusFilter !== "PENDING") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-slate-500 hover:text-red-500 text-xs font-bold"
              >
                {SYSTEM_MESSAGES.MGMT_ADJ.BTN_CLEAR_FILTER}
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-b-slate-100">
                  <TableHead className="py-4 font-semibold text-foreground px-6 text-xs uppercase tracking-wider">
                    {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_EMP}
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-foreground text-xs uppercase tracking-wider">
                    {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_ADJ_DATE}
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-foreground text-xs uppercase tracking-wider">
                    {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_TYPE}
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-foreground text-xs uppercase tracking-wider">
                    {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_STATUS}
                  </TableHead>
                  <TableHead className="py-4 font-semibold text-right text-xs uppercase tracking-wider px-6">
                    {SYSTEM_MESSAGES.MGMT_ADJ.TABLE_ACTIONS}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                        <p className="text-sm font-medium animate-pulse">
                          {SYSTEM_MESSAGES.APPROVE.LOADING_DATA}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-medium">
                          {SYSTEM_MESSAGES.MGMT_ADJ.EMPTY_DATA}
                        </p>
                        {(searchQuery || statusFilter !== "ALL") && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary font-bold"
                            onClick={clearAllFilters}
                          >
                            {SYSTEM_MESSAGES.MGMT_ADJ.BTN_CLEAR_FILTER}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group hover:bg-slate-50/80 cursor-pointer transition-colors border-b-slate-50"
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-slate-100 group-hover:ring-white transition-all">
                            <AvatarImage src={undefined} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase transition-colors group-hover:bg-primary group-hover:text-white">
                              {row.employeeName?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                              {row.employeeName}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
                              {row.department}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm">
                            {format(row.adjustmentDate, DATE_FORMAT)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {row.proposedTimeIn || "--:--"} ·{" "}
                            {row.proposedTimeOut || "--:--"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <TypeBadge type={row.type} />
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-slate-50 text-slate-600 hover:bg-primary hover:text-white rounded-xl font-bold h-9 px-4 transition-all"
                        >
                          {SYSTEM_MESSAGES.MGMT_ADJ.BTN_DETAIL}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm bg-slate-50/20">
            <div className="text-slate-500 font-medium">
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_PREFIX}{" "}
              <span className="text-slate-900 font-bold">
                {Math.min(paginatedData.length, PAGE_SIZE)}
              </span>{" "}
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_UNIT}
            </div>

            <div className="flex items-center gap-1.5 font-bold">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 rounded-xl disabled:opacity-30"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPagesFiltered }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i ? "default" : "outline"}
                  className={cn(
                    "h-9 w-9 rounded-xl border-slate-200",
                    page === i && "shadow-md shadow-primary/20",
                  )}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 rounded-xl disabled:opacity-30"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPagesFiltered - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <ReviewAdjustmentSheet
        open={openReview}
        onOpenChange={setOpenReview}
        request={detailRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
      />
    </>
  );
};

export default ApproveAdjustmentRequest;
