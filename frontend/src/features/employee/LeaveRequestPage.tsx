import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Plane,
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
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "@/constants/leave-request";
import { type LeaveFormValues } from "@/features/employee/schemas/leave-request.schema";
import { leaveService } from "@/services/leaveService";
import { employeeService } from "@/services/employeeService";
import {
  ActiveFilterBadge,
  StatusBadge,
  TypeBadge,
} from "./components/LeaveBadges";
import { LeaveDetailSheet } from "./components/LeaveDetailSheet";
import { CreateLeaveModal } from "./components/CreateLeaveModal";

import { SYSTEM_MESSAGES } from "@/constants/messages";

/* ══════════════ EMPTY STATE ══════════════ */

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
              {SYSTEM_MESSAGES.LEAVE.EMPTY_FILTER_TITLE}
            </p>
            <p className="text-sm">{SYSTEM_MESSAGES.LEAVE.EMPTY_FILTER_DESC}</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-foreground mb-1">
              {SYSTEM_MESSAGES.LEAVE.EMPTY_TITLE}
            </p>
            <p className="text-sm">{SYSTEM_MESSAGES.LEAVE.EMPTY_DESC}</p>
          </>
        )}
      </div>
    </TableCell>
  </TableRow>
);

/* ══════════════ MAIN PAGE ══════════════ */

export default function LeaveRequestPage() {
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);
  const [page, setPage] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

  /* ── Backend status → frontend union ── */
  const mapBackendStatus = (status: string): LeaveStatus => {
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
  };

  /* ── Load data on mount ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [leavePage, profileData] = await Promise.all([
          leaveService.getMyLeaves(),
          employeeService.getMyProfile(),
        ]);
        setEmployeeId(profileData.id);
        setProfile(profileData);
        setRequests(
          leavePage.content.map((dto) => ({
            id: String(dto.id),
            employeeName:
              dto.employeeName ||
              (profileData.firstName && profileData.lastName
                ? profileData.firstName + " " + profileData.lastName
                : "—"),
            employeeCode: profileData.employeeCode || "—",
            department: profileData.department || "—",
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
        setIsLoading(false);
      }
    };
    load();
  }, []);

  /* ── Filtered rows ── */
  const filtered = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (statusFilter === "ALL" || r.status === statusFilter) &&
      (typeFilter === "ALL" || r.type === typeFilter) &&
      (q === "" ||
        r.id.toLowerCase().includes(q) ||
        LEAVE_TYPE_CONFIG[r.type].label.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q))
    );
  });

  const hasFilter =
    statusFilter !== "ALL" || typeFilter !== "ALL" || searchQuery !== "";

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, typeFilter]);

  /* ── Handlers ── */
  const handleCreate = async (data: LeaveFormValues) => {
    // ─── Validate leave balance ───
    const requestedType = data.leaveType.toUpperCase();
    if (requestedType !== "UNPAID") {
      const requestedDays = differenceInDays(data.endDate, data.startDate) + 1;
      const leaveBalance = profile?.annualLeaveBalance ?? 0;

      if (requestedDays > leaveBalance) {
        throw new Error(SYSTEM_MESSAGES.LEAVE.MSG_INSUFFICIENT_BALANCE);
      }
    }

    const dto = await leaveService.createLeave({
      employeeId: employeeId ?? 1,
      leaveType: data.leaveType.toUpperCase(),
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      reason: data.reason,
    });
    const employeeFullName = profile
      ? profile.firstName + " " + profile.lastName
      : "—";
    const newReq: LeaveRequest = {
      id: String(dto.id),
      employeeName: employeeFullName,
      employeeCode: profile?.employeeCode || "—",
      department: profile?.department || "—",
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
          actor: profile
            ? profile.firstName + " " + profile.lastName
            : "Hệ thống",
          timestamp: new Date(),
        },
      ],
    };
    setRequests((prev) => [newReq, ...prev]);
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveService.cancelLeave(Number(id));
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.info(SYSTEM_MESSAGES.TOAST.LEAVE_CANCELLED);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSearchQuery("");
  };

  /* ── Render ── */
  return (
    <main className="page-layout-wrapper">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-heading">{SYSTEM_MESSAGES.LEAVE.TITLE}</h1>
          <p className="text-muted-foreground mt-1">
            {SYSTEM_MESSAGES.LEAVE.DESC}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 h-10 px-5 font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {SYSTEM_MESSAGES.LEAVE.BTN_CREATE}
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={SYSTEM_MESSAGES.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Trạng thái Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-sm shadow-sm whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {SYSTEM_MESSAGES.LEAVE.FILTER_STATUS}
              {statusFilter !== "ALL" && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <ActiveFilterBadge
                    value={LEAVE_STATUS_CONFIG[statusFilter].label}
                    colorClass="text-foreground bg-muted border-none"
                    onClear={() => setStatusFilter("ALL")}
                  />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem
              onClick={() => setStatusFilter("ALL")}
              className="font-medium cursor-pointer"
            >
              {ALL_LABEL}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {LEAVE_STATUS_OPTIONS.map(([value, config]) => (
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
                  {config.label}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Loại phép Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-sm shadow-sm whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {SYSTEM_MESSAGES.LEAVE.FILTER_TYPE}
              {typeFilter !== "ALL" && (
                <>
                  <div className="w-px h-4 bg-border mx-1" />
                  <ActiveFilterBadge
                    value={LEAVE_TYPE_CONFIG[typeFilter].label}
                    colorClass={LEAVE_TYPE_CONFIG[typeFilter].badgeClass}
                    onClear={() => setTypeFilter("ALL")}
                  />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem
              onClick={() => setTypeFilter("ALL")}
              className="font-medium cursor-pointer"
            >
              {ALL_LABEL}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {LEAVE_TYPE_OPTIONS.map(([value, config]) => (
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
                      "w-2 h-2 rounded-full inline-block",
                      config.dotClass,
                    )}
                  />
                  {config.label}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear all */}
        {hasFilter && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="h-9 px-3 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="w-4 h-4" />
            {SYSTEM_MESSAGES.LEAVE.BTN_CLEAR}
          </Button>
        )}
      </div>

      {/* ── Table Area ── */}
      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-semibold text-foreground px-6">
                  {SYSTEM_MESSAGES.LEAVE.TABLE_ID}
                </TableHead>
                <TableHead className="py-4 font-semibold text-foreground px-6">
                  {SYSTEM_MESSAGES.LEAVE.TABLE_DATE_CREATED}
                </TableHead>
                <TableHead className="py-4 font-semibold text-foreground px-6">
                  {SYSTEM_MESSAGES.LEAVE.TABLE_DATE_LEAVE}
                </TableHead>
                <TableHead className="py-4 font-semibold text-foreground px-6">
                  {SYSTEM_MESSAGES.LEAVE.TABLE_TYPE}
                </TableHead>
                <TableHead className="py-4 font-semibold text-foreground px-6">
                  {SYSTEM_MESSAGES.LEAVE.TABLE_STATUS}
                </TableHead>
                <TableHead className="py-4 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">{SYSTEM_MESSAGES.LOADING}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <EmptyState hasFilter={hasFilter} />
              ) : (
                paginated.map((req) => (
                  <TableRow
                    key={req.id}
                    className="hover:bg-muted/30 transition-colors border-border cursor-pointer group"
                    onClick={() => setDetailRequest(req)}
                  >
                    <TableCell className="px-6 py-4 font-mono text-xs font-semibold text-primary/80">
                      {req.id}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {format(req.dateCreated, DATE_FORMAT)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="font-medium text-foreground">
                        {format(req.startDate, DATE_FORMAT)}
                        {req.startDate.getTime() !== req.endDate.getTime() &&
                          ` – ${format(req.endDate, DATE_FORMAT)}`}
                      </span>
                      <span className="text-muted-foreground text-xs block mt-0.5">
                        {Math.ceil(
                          (req.endDate.getTime() - req.startDate.getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) + 1}{" "}
                        {SYSTEM_MESSAGES.LEAVE.DAYS}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <TypeBadge type={req.type} />
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
                                onClick={() => handleCancel(req.id)}
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

        {/* Summary footer */}
        <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            <span>
              {SYSTEM_MESSAGES.LEAVE.SUMMARY_SHOW}{" "}
              {filtered.length > 0 ? page * PAGE_SIZE + 1 : 0}-
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)}{" "}
              {SYSTEM_MESSAGES.LEAVE.SUMMARY_DIVIDER} {filtered.length}{" "}
              {SYSTEM_MESSAGES.LEAVE.SUMMARY_UNIT}
            </span>
            <div className="flex gap-4">
              {(
                ["PENDING", "APPROVED", "REJECTED", "RETURNED"] as LeaveStatus[]
              ).map((s) => {
                const count = requests.filter((r) => r.status === s).length;
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

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateLeaveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Detail Sheet */}
      <LeaveDetailSheet
        request={detailRequest}
        open={!!detailRequest}
        onClose={() => setDetailRequest(null)}
      />
    </main>
  );
}
