import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  SlidersHorizontal,
  X,
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

import type {
  LeaveFormValues,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from "./leave-request.constants";
import {
  ALL_LABEL,
  DATE_FORMAT,
  LEAVE_STATUS_CONFIG,
  LEAVE_TYPE_CONFIG,
  LEAVE_TYPE_OPTIONS,
} from "./leave-request.constants";
import { leaveService } from "@/services/leaveService";
import { employeeService } from "@/services/employeeService";
import {
  ActiveFilterBadge as ActiveLeaveBadge,
  StatusBadge as LeaveStatusBadge,
  TypeBadge as LeaveTypeBadge,
} from "./components/LeaveBadges";
import { LeaveDetailSheet } from "./components/LeaveDetailSheet";
import { CreateLeaveModal } from "./components/CreateLeaveModal";

import {
  ADJUSTMENT_STATUS_CONFIG,
  ADJUSTMENT_TYPE_CONFIG,
  ADJUSTMENT_TYPE_OPTIONS,
  type AdjustmentFormValues,
  type AdjustmentRequest,
  type AdjustmentStatus,
  type AdjustmentType,
} from "./adjustment-request.constants";
import {
  StatusBadge as AdjustmentStatusBadge,
  TypeBadge as AdjustmentTypeBadge,
} from "./components/AdjustmentBadges";
import { DetailSheet as AdjustmentDetailSheet } from "./components/AdjustmentDetailSheet";
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

const PAGE_SIZE = 10;

type UnifiedRequestCategory = "LEAVE" | "ADJUSTMENT";
type UnifiedRequestType = LeaveType | AdjustmentType;
type UnifiedRequestStatus = LeaveStatus | AdjustmentStatus;

interface UnifiedRequest {
  id: string;
  dateCreated: Date;
  category: UnifiedRequestCategory;
  type: UnifiedRequestType;
  status: UnifiedRequestStatus;
  reason: string;
  details: string;
  raw: LeaveRequest | AdjustmentRequest;
}

function mapBackendStatus(status: string): LeaveStatus {
  if (status.startsWith("PENDING")) return "PENDING";
  if (status === "RETURNED_TO_EMPLOYEE") return "RETURNED";
  if (status === "APPROVED" || status === "REJECTED")
    return status as LeaveStatus;
  return "PENDING";
}

function mapAdjustmentStatus(
  s: AdjustmentRequestSummary["status"],
): AdjustmentStatus {
  if (s === "APPROVED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "RETURNED_TO_EMPLOYEE") return "RETURNED";
  return "PENDING";
}

function deriveAdjustmentType(
  inTime: string | null,
  outTime: string | null,
): AdjustmentType {
  if (inTime && outTime) return "BOTH";
  if (inTime) return "CHECK_IN";
  return "CHECK_OUT";
}

const getStatusDotClass = (status: UnifiedRequestStatus): string => {
  switch (status) {
    case "PENDING":
      return "bg-amber-500";
    case "APPROVED":
      return "bg-emerald-500";
    case "REJECTED":
      return "bg-rose-500";
    case "RETURNED":
      return "bg-orange-500";
    default:
      return "bg-slate-400";
  }
};

function mapAdjustmentToFrontend(
  s: AdjustmentRequestSummary,
): AdjustmentRequest {
  return {
    id: String(s.id),
    dateCreated: new Date(s.createdAt),
    adjustmentDate: new Date(s.requestDate),
    type: deriveAdjustmentType(s.proposedCheckInTime, s.proposedCheckOutTime),
    proposedTimeIn: s.proposedCheckInTime
      ? format(new Date(s.proposedCheckInTime), "HH:mm")
      : undefined,
    proposedTimeOut: s.proposedCheckOutTime
      ? format(new Date(s.proposedCheckOutTime), "HH:mm")
      : undefined,
    status: mapAdjustmentStatus(s.status),
    reason: s.reasonText,
    auditTrail: [],
  };
}

function typeToReason(type: AdjustmentType): AdjustmentReason {
  if (type === "CHECK_IN") return "FORGOT_CHECKIN";
  if (type === "CHECK_OUT") return "FORGOT_CHECKOUT";
  return "OTHER";
}

function toISODateTime(date: Date, time: string): string {
  return `${format(date, "yyyy-MM-dd")}T${time}:00`;
}

const EmptyState = ({ hasFilter }: { hasFilter: boolean }) => (
  <TableRow>
    <TableCell colSpan={8} className="h-[400px] text-center">
      <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Plane className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        {hasFilter ? (
          <>
            <p className="text-base font-medium text-foreground mb-1">
              {SYSTEM_MESSAGES.REQUEST.EMPTY_FILTER_TITLE}
            </p>
            <p className="text-sm">{SYSTEM_MESSAGES.REQUEST.EMPTY_FILTER_DESC}</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-foreground mb-1">
              {SYSTEM_MESSAGES.REQUEST.EMPTY_TITLE}
            </p>
            <p className="text-sm">{SYSTEM_MESSAGES.REQUEST.EMPTY_DESC}</p>
          </>
        )}
      </div>
    </TableCell>
  </TableRow>
);

export default function RequestPage() {
  const effectiveRole = useEffectiveRole();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const [adjRequests, setAdjRequests] = useState<AdjustmentRequest[]>([]);
  const [adjLoading, setAdjLoading] = useState(true);
  const [adjPage, setAdjPage] = useState(0);
  const [adjTotalPages, setAdjTotalPages] = useState(0);
  const [adjTotalElements, setAdjTotalElements] = useState(0);

  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<UnifiedRequestStatus | "ALL">("ALL");
  const [requestType, setRequestType] = useState<UnifiedRequestType | "ALL">("ALL");

  const [detailRequest, setDetailRequest] = useState<UnifiedRequest | null>(null);
  const [editRequest, setEditRequest] = useState<AdjustmentRequest | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const [leavePage, profile] = await Promise.all([
        leaveService.getMyLeaves(),
        employeeService.getMyProfile(),
      ]);
      setEmployeeId(profile.id);
      setLeaveRequests(
        leavePage.content.map((dto) => ({
          id: String(dto.id),
          dateCreated: new Date(dto.createdAt),
          startDate: new Date(dto.startDate + "T00:00:00"),
          endDate: new Date(dto.endDate + "T00:00:00"),
          type: dto.leaveType.toLowerCase() as LeaveType,
          status: mapBackendStatus(dto.status),
          reason: dto.reason,
          auditTrail: [],
        })),
      );
    } catch {
      toast.error(SYSTEM_MESSAGES.API_ERROR);
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    setAdjLoading(true);
    try {
      const res = await attendanceService.getMyAdjustments({
        page: adjPage,
        size: PAGE_SIZE,
      });
      setAdjRequests(res.content.map(mapAdjustmentToFrontend));
      setAdjTotalElements(res.totalElements);
      setAdjTotalPages(res.totalPages);
    } catch {
      toast.error(SYSTEM_MESSAGES.ADJUSTMENT.MSG_FETCH_ERROR);
    } finally {
      setAdjLoading(false);
    }
  }, [adjPage]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  useEffect(() => {
    setAdjPage(0);
  }, [requestStatus, requestType, requestSearch]);

  const unifiedRequests = useMemo(() => {
    const mappedLeave: UnifiedRequest[] = leaveRequests.map((r) => ({
      id: r.id,
      dateCreated: r.dateCreated,
      category: "LEAVE",
      type: r.type,
      status: r.status,
      reason: r.reason,
      details: `${format(r.startDate, "yyyy-MM-dd")} → ${format(r.endDate, "yyyy-MM-dd")}`,
      raw: r,
    }));

    const mappedAdj: UnifiedRequest[] = adjRequests.map((r) => ({
      id: r.id,
      dateCreated: r.dateCreated,
      category: "ADJUSTMENT",
      type: r.type,
      status: r.status,
      reason: r.reason,
      details: format(r.adjustmentDate, "yyyy-MM-dd"),
      raw: r,
    }));

    return [...mappedLeave, ...mappedAdj].sort(
      (a, b) => b.dateCreated.getTime() - a.dateCreated.getTime(),
    );
  }, [leaveRequests, adjRequests]);

  const filteredRequests = unifiedRequests.filter((r) => {
    const q = requestSearch.toLowerCase();
    const matchesSearch =
      q === "" ||
      r.id.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      String(r.type).toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q);

    const matchesStatus = requestStatus === "ALL" || r.status === requestStatus;
    const matchesType = requestType === "ALL" || r.type === requestType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const hasFilter =
    requestStatus !== "ALL" || requestType !== "ALL" || requestSearch !== "";

  const handleCreateLeave = async (data: LeaveFormValues) => {
    if (employeeId == null) {
      throw new Error("Không lấy được thông tin nhân viên hiện tại");
    }

    await leaveService.createLeave({
      employeeId,
      leaveType: data.leaveType.toUpperCase(),
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      reason: data.reason,
    });

    const newReq: LeaveRequest = {
      id: String(dto.id),
      dateCreated: new Date(dto.createdAt),
      startDate: new Date(dto.startDate + "T00:00:00"),
      endDate: new Date(dto.endDate + "T00:00:00"),
      type: dto.leaveType.toLowerCase() as LeaveType,
      status: mapBackendStatus(dto.status),
      reason: dto.reason,
      auditTrail: [
        {
          id: "a1",
          action: "CREATED",
          actor: CURRENT_USER.name,
          timestamp: new Date(),
        },
      ],
    };

    setLeaveRequests((prev) => [newReq, ...prev]);
  };

  const handleCancelLeave = async (id: string) => {
    try {
      await leaveService.cancelLeave(Number(id));
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
      toast.info(SYSTEM_MESSAGES.TOAST.LEAVE_CANCELLED);
      if (detailRequest?.id === id) setDetailRequest(null);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    }
  };

  const handleCreateAdjustment = async (data: AdjustmentFormValues) => {
    const payload: CreateAdjustmentPayload = {
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

    await attendanceService.submitAdjustment(payload);
    setAdjPage(0);
    await fetchAdjustments();
    setActiveTab("adjustment");
  };

  const handleEditAdjustment = async (
    id: string,
    data: AdjustmentFormValues,
  ) => {
    const payload: CreateAdjustmentPayload = {
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

    await attendanceService.resubmitAdjustment(Number(id), payload);
    setEditRequest(null);
    await fetchAdjustments();
   
  };

  const handleResubmitAdjustment = (req: UnifiedRequest) => {
    if (req.category === "ADJUSTMENT") {
      setEditRequest(req.raw as AdjustmentRequest);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="page-layout-wrapper">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="page-heading">{SYSTEM_MESSAGES.REQUEST.TITLE}</h1>
              <p className="text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.REQUEST.DESC}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-sm gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {SYSTEM_MESSAGES.REQUEST.BTN_CREATE}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem
                    className="cursor-pointer text-sm"
                    onClick={() => setIsLeaveModalOpen(true)}
                  >
                    {SYSTEM_MESSAGES.REQUEST.CREATE_LEAVE}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-sm"
                    onClick={() => setIsAdjModalOpen(true)}
                  >
                    {SYSTEM_MESSAGES.REQUEST.CREATE_ADJUSTMENT}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={SYSTEM_MESSAGES.REQUEST.SEARCH_PLACEHOLDER}
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="pl-9 h-9 w-full text-sm"
              />
              {requestSearch && (
                <button
                  onClick={() => setRequestSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  className="h-9 gap-2 text-sm shadow-sm whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {SYSTEM_MESSAGES.REQUEST.FILTER_STATUS}
                  {requestStatus !== "ALL" && (
                    <>
                      <div className="w-px h-4 bg-border mx-1" />
                      <ActiveLeaveBadge
                        value={
                          (LEAVE_STATUS_CONFIG as any)[requestStatus]?.label ||
                          (ADJUSTMENT_STATUS_CONFIG as any)[requestStatus]?.label ||
                          requestStatus
                        }
                        colorClass="text-foreground bg-muted border-none"
                        onClear={() => setRequestStatus("ALL")}
                      />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => setRequestStatus("ALL")}
                  className="font-medium cursor-pointer"
                >
                  {SYSTEM_MESSAGES.REQUEST.FILTER_ALL_STATUS}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {[
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                  "RETURNED",
                ].map((value) => {
                  const label =
                    (LEAVE_STATUS_CONFIG as any)[value]?.label ||
                    (ADJUSTMENT_STATUS_CONFIG as any)[value]?.label ||
                    value;
                  const dotClass = getStatusDotClass(value as UnifiedRequestStatus);

                  return (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setRequestStatus(value as UnifiedRequestStatus)}
                      className={cn(
                        "cursor-pointer",
                        requestStatus === value && "bg-muted font-medium",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full inline-block shrink-0",
                            dotClass,
                          )}
                        />
                        {label}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {SYSTEM_MESSAGES.REQUEST.FILTER_TYPE}
                  {requestType !== "ALL" && (
                    <ActiveLeaveBadge
                      value={
                        (LEAVE_TYPE_CONFIG as any)[requestType]?.label ||
                        (ADJUSTMENT_TYPE_CONFIG as any)[requestType]?.label ||
                        requestType
                      }
                      colorClass="text-foreground bg-muted border-none"
                      onClear={() => setRequestType("ALL")}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[240px] max-h-[300px] overflow-auto">
                <DropdownMenuItem
                  onClick={() => setRequestType("ALL")}
                  className={cn(
                    "cursor-pointer text-sm",
                    requestType === "ALL" && "font-bold text-primary",
                  )}
                >
                  {ALL_LABEL}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {LEAVE_TYPE_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={`leave-${value}`}
                    onClick={() => setRequestType(value as UnifiedRequestType)}
                    className={cn(
                      "cursor-pointer",
                      requestType === value && "bg-muted font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", cfg.badgeClass)} />
                      {cfg.label} (Nghỉ phép)
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {ADJUSTMENT_TYPE_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={`adj-${value}`}
                    onClick={() => setRequestType(value as UnifiedRequestType)}
                    className={cn(
                      "cursor-pointer",
                      requestType === value && "bg-muted font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full inline-block shrink-0", cfg.badgeClass)} />
                      {cfg.label} (Điều chỉnh)
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasFilter && (
              <Button
                variant="ghost"
                onClick={() => {
                  setRequestSearch("");
                  setRequestStatus("ALL");
                  setRequestType("ALL");
                }}
                className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X className="w-4 h-4" />
                {SYSTEM_MESSAGES.LEAVE.BTN_CLEAR}
              </Button>
            )}
          </div>

          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.REQUEST.TABLE_ID}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.REQUEST.TABLE_DATE_CREATED}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.REQUEST.TABLE_TYPE}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.REQUEST.TABLE_STATUS}
                    </TableHead>
                    <TableHead className="py-4 font-semibold text-foreground px-6">
                      {SYSTEM_MESSAGES.REQUEST.TABLE_REASON}
                    </TableHead>
                    
                   
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (leaveLoading || adjLoading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[400px] text-center">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="text-sm">{SYSTEM_MESSAGES.LOADING}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (filteredRequests.length === 0) {
                      return <EmptyState hasFilter={hasFilter} />;
                    }

                    return filteredRequests.map((req) => (
                      <TableRow
                        key={`${req.category}-${req.id}`}
                        className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                        onClick={() => setDetailRequest(req)}
                      >
                        <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary/80">
                          {req.id}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(req.dateCreated, DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm font-medium">
                          {req.category === "LEAVE" ? "Nghỉ phép" : "Điều chỉnh"}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {req.category === "LEAVE" ? (
                            <LeaveTypeBadge type={req.type as LeaveType} />
                          ) : (
                            <AdjustmentTypeBadge type={req.type as AdjustmentType} />
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {req.category === "LEAVE" ? (
                            <LeaveStatusBadge status={req.status as LeaveStatus} />
                          ) : (
                            <AdjustmentStatusBadge status={req.status as AdjustmentStatus} />
                          )}
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
                                Chi tiết
                              </DropdownMenuItem>
                              {req.category === "LEAVE" && req.status === "PENDING" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm text-destructive focus:text-destructive"
                                    onClick={() => handleCancelLeave(req.id)}
                                  >
                                    {SYSTEM_MESSAGES.LEAVE.BTN_CANCEL}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {req.category === "ADJUSTMENT" && req.status === "RETURNED" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm text-primary font-medium"
                                    onClick={() => handleResubmitAdjustment(req)}
                                  >
                                    {SYSTEM_MESSAGES.ADJUSTMENT.BTN_RESEND}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>

            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredRequests.length} đơn (trong đó {adjTotalElements} điều chỉnh) trên tổng {unifiedRequests.length} đơn - {adjTotalPages} trang điều chỉnh
              </span>
            </div>
          </div>

          <CreateLeaveModal
            open={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            onSubmit={handleCreateLeave}
          />

          <CreateRequestModal
            open={isAdjModalOpen}
            onClose={() => setIsAdjModalOpen(false)}
            onSubmit={handleCreateAdjustment}
          />

          {detailRequest?.category === "LEAVE" && (
            <LeaveDetailSheet
              request={detailRequest.raw as LeaveRequest}
              open={true}
              onClose={() => setDetailRequest(null)}
            />
          )}

          {detailRequest?.category === "ADJUSTMENT" && (
            <AdjustmentDetailSheet
              request={detailRequest.raw as AdjustmentRequest}
              open={true}
              onClose={() => setDetailRequest(null)}
            />
          )}

          <EditRequestModal
            request={editRequest}
            open={!!editRequest}
            onClose={() => setEditRequest(null)}
            onSubmit={(id, data) => handleEditAdjustment(id, data)}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
