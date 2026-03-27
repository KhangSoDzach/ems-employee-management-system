import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Plane,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

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
  ALL_LABEL,
  DATE_FORMAT,
  LEAVE_STATUS_CONFIG,
  LEAVE_STATUS_OPTIONS,
  LEAVE_TYPE_CONFIG,
  LEAVE_TYPE_OPTIONS,
  type LeaveFormValues,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "./leave-request.constants";
import { leaveService } from "@/services/leaveService";
import { employeeService } from "@/services/employeeService";
import {
  ActiveFilterBadge,
  StatusBadge,
  TypeBadge,
} from "./components/LeaveBadges";
import { LeaveDetailSheet } from "./components/LeaveDetailSheet";
import { CreateLeaveModal } from "./components/CreateLeaveModal";

import {
  ADJUSTMENT_STATUS_CONFIG,
  ADJUSTMENT_STATUS_OPTIONS,
  ADJUSTMENT_TYPE_CONFIG,
  ADJUSTMENT_TYPE_OPTIONS,
  DATE_FORMAT as ADJ_DATE_FORMAT,
  type AdjustmentFormValues,
  type AdjustmentRequest,
  type AdjustmentStatus,
  type AdjustmentType,
} from "./adjustment-request.constants";
import {
  ActiveFilterBadge as ActiveAdjustmentBadge,
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

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

function extractApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string>;
      };
    };
  };

  const fieldErrors = apiError?.response?.data?.errors;
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return Object.values(fieldErrors)[0] ?? fallback;
  }

  return apiError?.response?.data?.message ?? fallback;
}

function mapBackendStatus(status: string): LeaveStatus {
  if (status.startsWith("PENDING")) {
    return "PENDING";
  }
  if (status === "RETURNED_TO_EMPLOYEE") {
    return "RETURNED";
  }
  if (status === "APPROVED" || status === "REJECTED") {
    return status as LeaveStatus;
  }
  return "PENDING";
}

function mapAdjustmentStatus(
  s: AdjustmentRequestSummary["status"],
): AdjustmentStatus {
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

function deriveAdjustmentType(
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
    employeeName: s.employeeName,
    employeeCode: s.employeeCode,
  };
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

function buildAdjustmentPayload(
  data: AdjustmentFormValues,
): CreateAdjustmentPayload {
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

const EmptyState = ({ hasFilter }: { hasFilter: boolean }) => (
  <TableRow>
    <TableCell colSpan={6} className="h-[400px] text-center">
      <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Plane className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        {hasFilter ? (
          <>
            <p className="text-base font-medium text-foreground mb-1">
              {SYSTEM_MESSAGES.REQUEST.EMPTY_FILTER_TITLE}
            </p>
            <p className="text-sm">
              {SYSTEM_MESSAGES.REQUEST.EMPTY_FILTER_DESC}
            </p>
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
  // useEffectiveRole removed as it's unused
  // Leave state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leavePage, setLeavePage] = useState(0);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveStatus, setLeaveStatus] = useState<LeaveStatus | "ALL">("ALL");
  const [leaveType, setLeaveType] = useState<LeaveType | "ALL">("ALL");
  const [leaveDetail, setLeaveDetail] = useState<LeaveRequest | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Adjustment state
  const [adjRequests, setAdjRequests] = useState<AdjustmentRequest[]>([]);
  const [adjLoading, setAdjLoading] = useState(true);
  const [adjPage, setAdjPage] = useState(0);
  const [adjSearch, setAdjSearch] = useState("");
  const [adjStatus, setAdjStatus] = useState<AdjustmentStatus | "ALL">("ALL");
  const [adjType, setAdjType] = useState<AdjustmentType | "ALL">("ALL");
  const [adjDetail, setAdjDetail] = useState<AdjustmentRequest | null>(null);
  const [adjEdit, setAdjEdit] = useState<AdjustmentRequest | null>(null);
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"leave" | "adjustment">("leave");

  const fetchLeaves = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const [leaveRes, profile] = await Promise.all([
        leaveService.getMyLeaves({ page: 0, size: 1000 }),
        employeeService.getMyProfile(),
      ]);
      setEmployeeId(profile.id);
      setLeaveRequests(
        leaveRes.content.map((dto) => ({
          id: String(dto.id),
          dateCreated: new Date(dto.createdAt),
          startDate: new Date(dto.startDate + "T00:00:00"),
          endDate: new Date(dto.endDate + "T00:00:00"),
          type: dto.leaveType.toLowerCase() as LeaveType,
          status: mapBackendStatus(dto.status),
          reason: dto.reason,
          auditTrail: [],
          employeeName: `${profile.firstName} ${profile.lastName}`,
          employeeCode: profile.employeeCode ?? "N/A",
          department: profile.department ?? "N/A",
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
      const [adjRes, profile] = await Promise.all([
        attendanceService.getMyAdjustments({ page: 0, size: 1000 }),
        employeeService.getMyProfile(),
      ]);
      setAdjRequests(
        adjRes.content.map((s) => ({
          ...mapAdjustmentToFrontend(s),
          employeeName: `${profile.firstName} ${profile.lastName}`,
          employeeCode: profile.employeeCode ?? "N/A",
          department: profile.department ?? "N/A",
        })),
      );
    } catch {
      toast.error(SYSTEM_MESSAGES.ADJUSTMENT.MSG_FETCH_ERROR);
    } finally {
      setAdjLoading(false);
    }
  }, []);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "adjustment") {
      setActiveTab("adjustment");
    } else if (tab === "leave") {
      setActiveTab("leave");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  useEffect(() => {
    setAdjPage(0);
  }, [adjStatus, adjType]);

  const filteredLeaves = leaveRequests.filter((r) => {
    const q = leaveSearch.toLowerCase();
    return (
      (leaveStatus === "ALL" || r.status === leaveStatus) &&
      (leaveType === "ALL" || r.type === leaveType) &&
      (q === "" ||
        r.id.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        LEAVE_TYPE_CONFIG[r.type].label.toLowerCase().includes(q))
    );
  });

  const leaveTotalElementsFiltered = filteredLeaves.length;
  const leaveTotalPagesFiltered = Math.ceil(
    leaveTotalElementsFiltered / PAGE_SIZE,
  );
  const paginatedLeaves = filteredLeaves.slice(
    leavePage * PAGE_SIZE,
    (leavePage + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setLeavePage(0);
  }, [leaveSearch, leaveStatus, leaveType]);

  const filteredAdj = adjRequests.filter((r) => {
    const q = adjSearch.toLowerCase();
    return (
      (adjStatus === "ALL" || r.status === adjStatus) &&
      (adjType === "ALL" || r.type === adjType) &&
      (q === "" ||
        r.id.toLowerCase().includes(q) ||
        ADJUSTMENT_TYPE_CONFIG[r.type].label.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q))
    );
  });

  const adjTotalElementsFiltered = filteredAdj.length;
  const adjTotalPagesFiltered = Math.ceil(adjTotalElementsFiltered / PAGE_SIZE);
  const paginatedAdj = filteredAdj.slice(
    adjPage * PAGE_SIZE,
    (adjPage + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setAdjPage(0);
  }, [adjSearch, adjStatus, adjType]);

  const leaveHasFilter =
    leaveSearch !== "" || leaveStatus !== "ALL" || leaveType !== "ALL";
  const adjHasFilter =
    adjSearch !== "" || adjStatus !== "ALL" || adjType !== "ALL";

  const handleCreateLeave = async (data: LeaveFormValues) => {
    if (employeeId === null) {
      throw new Error("Không lấy được thông tin nhân viên hiện tại");
    }

    await leaveService.createLeave({
      employeeId,
      leaveType: data.leaveType.toUpperCase(),
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      reason: data.reason,
    });
    await fetchLeaves();
  };

  const handleCancelLeave = async (id: string) => {
    try {
      await leaveService.cancelLeave(Number(id));
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
      toast.info(SYSTEM_MESSAGES.TOAST.LEAVE_CANCELLED);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    }
  };

  const handleCreateAdjustment = async (data: AdjustmentFormValues) => {
    try {
      const payload = buildAdjustmentPayload(data);
      await attendanceService.submitAdjustment(payload);
      setAdjPage(0);
      await fetchAdjustments();
      setActiveTab("adjustment");
      toast.success(SYSTEM_MESSAGES.ADJUSTMENT.MSG_SUBMIT_SUCCESS);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, SYSTEM_MESSAGES.API_ERROR));
      throw error;
    }
  };

  const handleEditAdjustment = async (
    id: string,
    data: AdjustmentFormValues,
  ) => {
    try {
      const payload = buildAdjustmentPayload(data);
      await attendanceService.resubmitAdjustment(Number(id), payload);
      setAdjPage(0);
      await fetchAdjustments();
      setActiveTab("adjustment");
      toast.success(SYSTEM_MESSAGES.ADJUSTMENT.MSG_RESUBMIT_SUCCESS);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, SYSTEM_MESSAGES.API_ERROR));
      throw error;
    }
  };

  return (
    <main className="page-layout-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-heading">
            {activeTab === "leave"
              ? SYSTEM_MESSAGES.LEAVE.TITLE
              : SYSTEM_MESSAGES.ADJUSTMENT.TITLE}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === "leave"
              ? SYSTEM_MESSAGES.LEAVE.DESC
              : SYSTEM_MESSAGES.ADJUSTMENT.DESC}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="shadow-sm gap-2"
            onClick={() => {
              if (activeTab === "leave") {
                setIsLeaveModalOpen(true);
              } else {
                setIsAdjModalOpen(true);
              }
            }}
          >
            <Plus className="w-4 h-4" />
            {SYSTEM_MESSAGES.REQUEST.BTN_CREATE}
          </Button>
        </div>
      </div>

      {activeTab === "leave" ? (
        <>
          {/* Leave Request UI (same as LeaveRequestPage) */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={SYSTEM_MESSAGES.REQUEST.SEARCH_PLACEHOLDER}
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                className="pl-9 h-9 w-full text-sm"
              />
              {leaveSearch && (
                <button
                  onClick={() => setLeaveSearch("")}
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
                  {leaveStatus !== "ALL" && (
                    <ActiveFilterBadge
                      value={LEAVE_STATUS_CONFIG[leaveStatus].label}
                      colorClass={LEAVE_STATUS_CONFIG[leaveStatus].filterClass}
                      onClear={() => setLeaveStatus("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => setLeaveStatus("ALL")}
                  className={cn(
                    "font-medium cursor-pointer",
                    leaveStatus === "ALL" && "font-bold text-primary",
                  )}
                >
                  {SYSTEM_MESSAGES.REQUEST.FILTER_ALL_STATUS}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {LEAVE_STATUS_OPTIONS.map(([value, config]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setLeaveStatus(value)}
                    className={cn(
                      "cursor-pointer",
                      leaveStatus === value && "bg-muted font-medium",
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
                      {config.label}
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
                  className="h-9 gap-2 text-sm shadow-sm whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {SYSTEM_MESSAGES.REQUEST.FILTER_TYPE}
                  {leaveType !== "ALL" && (
                    <ActiveFilterBadge
                      value={LEAVE_TYPE_CONFIG[leaveType].label}
                      colorClass={LEAVE_TYPE_CONFIG[leaveType].filterClass}
                      onClear={() => setLeaveType("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => setLeaveType("ALL")}
                  className={cn(
                    "font-medium cursor-pointer",
                    leaveType === "ALL" && "font-bold text-primary",
                  )}
                >
                  {SYSTEM_MESSAGES.REQUEST.FILTER_ALL_TYPE}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {LEAVE_TYPE_OPTIONS.map(([value, config]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setLeaveType(value)}
                    className={cn(
                      "cursor-pointer",
                      leaveType === value && "bg-muted font-medium",
                    )}
                  >
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {leaveHasFilter && (
              <Button
                variant="ghost"
                onClick={() => {
                  setLeaveSearch("");
                  setLeaveStatus("ALL");
                  setLeaveType("ALL");
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
                    <TableHead className="py-4 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground font-medium">
                            {SYSTEM_MESSAGES.LOADING}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : leaveRequests.length === 0 ||
                    (leaveHasFilter && paginatedLeaves.length === 0) ? (
                    <EmptyState hasFilter={leaveHasFilter} />
                  ) : (
                    paginatedLeaves.map((req) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                        onClick={() => setLeaveDetail(req)}
                      >
                        <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary/80">
                          {req.id}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(req.dateCreated, DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <TypeBadge type={req.type} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {req.reason}
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
                                onClick={() => setLeaveDetail(req)}
                              >
                                {SYSTEM_MESSAGES.LEAVE.BTN_DETAIL}
                              </DropdownMenuItem>
                              {req.status === "RETURNED" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer text-sm text-primary font-medium">
                                    {SYSTEM_MESSAGES.LEAVE.BTN_RESEND}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {req.status === "PENDING" && (
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex flex-col gap-1">
                <span>
                  {SYSTEM_MESSAGES.LEAVE.SUMMARY_SHOW} {paginatedLeaves.length}{" "}
                  {SYSTEM_MESSAGES.LEAVE.SUMMARY_DIVIDER}{" "}
                  {leaveTotalElementsFiltered}{" "}
                  {SYSTEM_MESSAGES.LEAVE.SUMMARY_UNIT}
                </span>
                <div className="flex gap-4">
                  {(
                    [
                      "PENDING",
                      "APPROVED",
                      "REJECTED",
                      "RETURNED",
                    ] as LeaveStatus[]
                  ).map((s) => {
                    const count = filteredLeaves.filter(
                      (r) => r.status === s,
                    ).length;
                    return count > 0 ? (
                      <span key={s}>
                        <span className="font-semibold text-foreground">
                          {count}
                        </span>{" "}
                        {LEAVE_STATUS_CONFIG[s].label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              {leaveTotalPagesFiltered > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={leavePage === 0}
                    onClick={() => setLeavePage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {leavePage + 1} / {leaveTotalPagesFiltered}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={leavePage >= leaveTotalPagesFiltered - 1}
                    onClick={() =>
                      setLeavePage((p) =>
                        Math.min(leaveTotalPagesFiltered - 1, p + 1),
                      )
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <CreateLeaveModal
            open={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            onSubmit={handleCreateLeave}
          />

          <LeaveDetailSheet
            request={leaveDetail}
            open={!!leaveDetail}
            onClose={() => setLeaveDetail(null)}
          />
        </>
      ) : (
        <>
          {/* Adjustment Request UI (same as AdjustmentRequestPage) */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={SYSTEM_MESSAGES.REQUEST.SEARCH_PLACEHOLDER}
                value={adjSearch}
                onChange={(e) => setAdjSearch(e.target.value)}
                className="pl-9 h-9 w-full text-sm"
              />
              {adjSearch && (
                <button
                  type="button"
                  onClick={() => setAdjSearch("")}
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
                  {SYSTEM_MESSAGES.REQUEST.FILTER_STATUS}
                  {adjStatus !== "ALL" && (
                    <ActiveAdjustmentBadge
                      value={
                        ADJUSTMENT_STATUS_CONFIG[adjStatus as AdjustmentStatus]
                          .label
                      }
                      colorClass={
                        ADJUSTMENT_STATUS_CONFIG[adjStatus as AdjustmentStatus]
                          .filterClass
                      }
                      onClear={() => setAdjStatus("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => setAdjStatus("ALL")}
                  className={cn(
                    "cursor-pointer text-sm",
                    adjStatus === "ALL" && "font-bold text-primary",
                  )}
                >
                  {ALL_LABEL}
                </DropdownMenuItem>
                {ADJUSTMENT_STATUS_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setAdjStatus(value)}
                    className={cn(
                      "cursor-pointer",
                      adjStatus === value && "bg-muted font-medium",
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
                  {SYSTEM_MESSAGES.REQUEST.FILTER_TYPE}
                  {adjType !== "ALL" && (
                    <ActiveAdjustmentBadge
                      value={
                        ADJUSTMENT_TYPE_CONFIG[adjType as AdjustmentType].label
                      }
                      colorClass={
                        ADJUSTMENT_TYPE_CONFIG[adjType as AdjustmentType]
                          .filterClass
                      }
                      onClear={() => setAdjType("ALL")}
                      showClearButton={false}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => setAdjType("ALL")}
                  className={cn(
                    "cursor-pointer text-sm",
                    adjType === "ALL" && "font-bold text-primary",
                  )}
                >
                  {ALL_LABEL}
                </DropdownMenuItem>
                {ADJUSTMENT_TYPE_OPTIONS.map(([value, cfg]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setAdjType(value)}
                    className={cn(
                      "cursor-pointer",
                      adjType === value && "bg-muted font-medium",
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

            {adjHasFilter && (
              <Button
                variant="ghost"
                onClick={() => {
                  setAdjSearch("");
                  setAdjStatus("ALL");
                  setAdjType("ALL");
                }}
                className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X className="w-4 h-4" />
                {SYSTEM_MESSAGES.ADJUSTMENT.BTN_CLEAR}
              </Button>
            )}
          </div>

          <div className="border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
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
                    <TableHead className="py-4 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedAdj.length === 0 ? (
                    <EmptyState hasFilter={adjHasFilter} />
                  ) : (
                    paginatedAdj.map((req) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                        onClick={() => setAdjDetail(req)}
                      >
                        <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary/80">
                          {req.id}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {format(req.dateCreated, ADJ_DATE_FORMAT)}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <AdjustmentTypeBadge type={req.type} />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <AdjustmentStatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                          {req.reason}
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
                                onClick={() => setAdjDetail(req)}
                              >
                                {SYSTEM_MESSAGES.ADJUSTMENT.BTN_DETAIL}
                              </DropdownMenuItem>
                              {req.status === "RETURNED" && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm"
                                    onClick={() => setAdjEdit(req)}
                                  >
                                    {SYSTEM_MESSAGES.ADJUSTMENT.BTN_EDIT_RESEND}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-sm text-primary font-medium"
                                    onClick={() => setAdjEdit(req)}
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

            <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {SYSTEM_MESSAGES.ADJUSTMENT.SUMMARY_TOTAL}{" "}
                {adjTotalElementsFiltered}{" "}
                {SYSTEM_MESSAGES.ADJUSTMENT.SUMMARY_UNIT}
              </span>
              {adjTotalPagesFiltered > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={adjPage === 0}
                    onClick={() => setAdjPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>
                    {adjPage + 1}
                    {SYSTEM_MESSAGES.SYMBOLS.SLASH}
                    {adjTotalPagesFiltered}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    disabled={adjPage >= adjTotalPagesFiltered - 1}
                    onClick={() =>
                      setAdjPage((p) =>
                        Math.min(adjTotalPagesFiltered - 1, p + 1),
                      )
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <CreateRequestModal
            open={isAdjModalOpen}
            onClose={() => setIsAdjModalOpen(false)}
            onSubmit={handleCreateAdjustment}
          />
          <AdjustmentDetailSheet
            request={adjDetail}
            open={!!adjDetail}
            onClose={() => setAdjDetail(null)}
          />
          <EditRequestModal
            request={adjEdit}
            open={!!adjEdit}
            onClose={() => setAdjEdit(null)}
            onSubmit={handleEditAdjustment}
          />
        </>
      )}
    </main>
  );
}
