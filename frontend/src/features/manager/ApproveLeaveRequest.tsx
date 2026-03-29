import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import ApproveLeaveDialog from "./components/ApproveLeaveModal";
import { leaveService, type LeaveResponseDTO } from "@/services/leaveService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { ActiveFilterBadge } from "../employee/components/AdjustmentBadges";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

export type LeaveRequest = {
  id: number;
  name: string;
  dept: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number | null;
  reason: string;
  status: string;
  createdAt: string;
  requesterUserId?: number;
};

function mapDto(dto: LeaveResponseDTO): LeaveRequest {
  return {
    id: dto.id,
    name: dto.employeeName ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE,
    dept: SYSTEM_MESSAGES.COMMON.EMPTY_VALUE,
    leaveType: dto.leaveType,
    startDate: dto.startDate,
    endDate: dto.endDate,
    duration: dto.duration,
    reason: dto.reason,
    status: dto.status,
    createdAt: dto.createdAt,
    requesterUserId: dto.requesterUserId,
  };
}

/* ================= TYPE BADGE ================= */

const LEAVE_TYPE_MAP: Record<string, { label: string; cls: string }> = {
  ANNUAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_ANNUAL,
    cls: "badge-info-hover",
  },
  SICK: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_SICK,
    cls: "badge-success-hover",
  },
  UNPAID: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_UNPAID,
    cls: "badge-error-hover",
  },
  PERSONAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_PERSONAL,
    cls: "badge-purple-hover",
  },
};

const renderLeaveType = (type: string) => {
  const cfg = LEAVE_TYPE_MAP[type] ?? {
    label: type,
    cls: "bg-muted text-muted-foreground",
  };
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
};

/* ================= STATUS BADGE ================= */

const STATUS_MAP = {
  PENDING: {
    label: SYSTEM_MESSAGES.STATUS.PENDING,
    cls: "badge-warning-hover border-amber-200",
    filterClass: "badge-warning border-amber-200",
  },
  APPROVED: {
    label: SYSTEM_MESSAGES.STATUS.APPROVED,
    cls: "badge-success-hover border-emerald-200",
    filterClass: "badge-success border-emerald-200",
  },
  REJECTED: {
    label: SYSTEM_MESSAGES.STATUS.REJECTED,
    cls: "badge-error-hover border-rose-200",
    filterClass: "badge-error border-rose-200",
  },
  RETURNED_TO_EMPLOYEE: {
    label: SYSTEM_MESSAGES.STATUS.RETURNED,
    cls: "badge-gray-hover border-slate-200",
    filterClass: "badge-gray border-slate-200",
  },
} as const;

const LEAVE_TYPE_FILTER_CONFIG: Record<
  string,
  { label: string; filterClass: string }
> = {
  ANNUAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_ANNUAL,
    filterClass: "badge-info border-blue-200",
  },
  SICK: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_SICK,
    filterClass: "badge-success border-emerald-200",
  },
  UNPAID: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_UNPAID,
    filterClass: "badge-error border-rose-200",
  },
  PERSONAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_PERSONAL,
    filterClass: "badge-purple border-violet-200",
  },
};

const renderStatus = (status: string) => {
  const isPendingStatus = status.startsWith("PENDING");
  const cfg = isPendingStatus
    ? STATUS_MAP.PENDING
    : ((STATUS_MAP as Record<string, { label: string; cls: string }>)[
        status
      ] ?? {
        label: status,
        cls: "bg-muted text-muted-foreground hover:bg-muted",
      });
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
};

/* ================= EMPTY STATE ================= */

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-64 text-center">
      <p className="text-muted-foreground">{SYSTEM_MESSAGES.NO_DATA}</p>
    </TableCell>
  </TableRow>
);

/* ================= CONSTANTS ================= */

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

/* ================= MAIN PAGE ================= */

export default function ApproveLeaveRequest() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );

  const pendingCount = data.filter((r) =>
    r.status.startsWith("PENDING"),
  ).length;

  /* ================= LOAD TEAM LEAVES ================= */

  useEffect(() => {
    setIsLoading(true);
    leaveService
      .getTeamLeaves({ page: 0, size: 1000 })
      .then((res) => {
        setData(res.content.map(mapDto));
      })
      .catch(() => toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR))
      .finally(() => setIsLoading(false));
  }, []);

  /* ================= FILTER LOGIC ================= */

  const filtered = data.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "ALL" ? true : r.leaveType === filterType;
    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PENDING"
          ? r.status.startsWith("PENDING")
          : r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalElementsFiltered = filtered.length;
  const totalPagesFiltered = Math.ceil(totalElementsFiltered / PAGE_SIZE);
  const paginatedData = filtered.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  /* ================= RESET PAGE ON FILTER ================= */

  useEffect(() => {
    setPage(0);
  }, [search, filterType, statusFilter]);

  const clearAllFilters = () => {
    setSearch("");
    setFilterType("ALL");
    setStatusFilter("ALL");
  };

  /* ================= UPDATE STATUS LOCALLY ================= */

  const handleUpdateStatus = (id: number, status: string) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  return (
    <>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="page-heading">
              {SYSTEM_MESSAGES.APPROVE.LEAVE_TITLE}
            </h1>
            <p className="text-muted-foreground mt-1">
              {SYSTEM_MESSAGES.APPROVE.LEAVE_LIST_DESC}
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
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative w-full sm:w-auto sm:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={SYSTEM_MESSAGES.APPROVE.SEARCH_EMP}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full text-sm border-slate-200 focus:border-primary focus:ring-primary shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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
                className="h-10 px-4 gap-3 text-sm border-slate-200 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-slate-700">
                  {SYSTEM_MESSAGES.LEAVE.FILTER_STATUS}
                </span>
                {statusFilter !== "ALL" && (
                  <ActiveFilterBadge
                    value={
                      statusFilter === "PENDING"
                        ? SYSTEM_MESSAGES.STATUS.PENDING
                        : (STATUS_MAP as any)[statusFilter]?.label ||
                          statusFilter
                    }
                    colorClass={
                      (STATUS_MAP as any)[
                        statusFilter === "PENDING" ? "PENDING" : statusFilter
                      ]?.filterClass || ""
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
              {Object.entries(STATUS_MAP).map(([key, cfg]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "cursor-pointer",
                    statusFilter === key
                      ? "bg-muted font-medium"
                      : "hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-2.5 py-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full inline-block shrink-0",
                        key === "PENDING" && "bg-amber-500",
                        key === "APPROVED" && "bg-emerald-500",
                        key === "REJECTED" && "bg-rose-500",
                        key === "RETURNED_TO_EMPLOYEE" && "bg-orange-500",
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
                className="h-10 px-4 gap-3 text-sm border-slate-200 shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-slate-700">
                  {SYSTEM_MESSAGES.LEAVE.FILTER_TYPE}
                </span>
                {filterType !== "ALL" && (
                  <ActiveFilterBadge
                    value={
                      LEAVE_TYPE_FILTER_CONFIG[filterType]?.label || filterType
                    }
                    colorClass={
                      LEAVE_TYPE_FILTER_CONFIG[filterType]?.filterClass || ""
                    }
                    onClear={() => setFilterType("ALL")}
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 p-1">
              <DropdownMenuItem
                onClick={() => setFilterType("ALL")}
                className={cn(
                  "cursor-pointer text-sm",
                  filterType === "ALL" && "bg-muted font-bold text-primary",
                )}
              >
                {SYSTEM_MESSAGES.LABEL_ALL}
              </DropdownMenuItem>
              {Object.entries(LEAVE_TYPE_FILTER_CONFIG).map(([key, cfg]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={cn(
                    "cursor-pointer",
                    filterType === key
                      ? "bg-muted font-medium"
                      : "hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-2.5 py-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full inline-block shrink-0",
                        key === "ANNUAL" && "bg-blue-500",
                        key === "SICK" && "bg-emerald-500",
                        key === "UNPAID" && "bg-rose-500",
                        key === "PERSONAL" && "bg-violet-500",
                      )}
                    />
                    {cfg.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(statusFilter !== "ALL" ||
            filterType !== "ALL" ||
            search !== "") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-sm text-slate-500 hover:text-primary transition-colors hover:bg-transparent"
              onClick={clearAllFilters}
            >
              {SYSTEM_MESSAGES.LEAVE.BTN_CLEAR}
            </Button>
          )}

          <div className="flex-1" />
        </div>

        {/* TABLE */}
        <div className="card-soft">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{SYSTEM_MESSAGES.APPROVE.TABLE_COL_EMP}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.APPROVE.TABLE_COL_DEPT}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.APPROVE.TABLE_COL_TYPE}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.APPROVE.TABLE_COL_TIME}</TableHead>
                <TableHead>
                  {SYSTEM_MESSAGES.APPROVE.TABLE_COL_STATUS}
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">
                        {SYSTEM_MESSAGES.APPROVE.LOADING_DATA}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <EmptyState />
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedRequest(row)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{row.dept}</TableCell>
                    <TableCell>{renderLeaveType(row.leaveType)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(row.startDate + "T00:00:00"), "dd/MM")}
                      {row.startDate !== row.endDate &&
                        `${SYSTEM_MESSAGES.SYMBOLS.DASH}${format(new Date(row.endDate + "T00:00:00"), "dd/MM")}`}
                      {row.duration !== null && (
                        <span className="ml-1 text-muted-foreground">
                          {SYSTEM_MESSAGES.SYMBOLS.PAREN_OPEN}
                          {row.duration}
                          {SYSTEM_MESSAGES.APPROVE.UNIT_DAYS}
                          {SYSTEM_MESSAGES.SYMBOLS.PAREN_CLOSE}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{renderStatus(row.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedRequest(row)}
                          >
                            {SYSTEM_MESSAGES.APPROVE.VIEW_DETAIL}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_PREFIX}{" "}
              <span className="font-medium text-foreground">
                {totalElementsFiltered === 0 ? 0 : page * PAGE_SIZE + 1}
                {" – "}
                {Math.min((page + 1) * PAGE_SIZE, totalElementsFiltered)}
              </span>{" "}
              {SYSTEM_MESSAGES.MEMBER_LIST.PAGINATION_IN}{" "}
              <span className="font-medium text-foreground">
                {totalElementsFiltered}
              </span>{" "}
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_UNIT}
            </p>
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
              {Array.from({ length: totalPagesFiltered }, (_, i) => (
                <Button
                  key={i}
                  size="icon"
                  variant={i === page ? "default" : "ghost"}
                  className={cn(
                    "w-8 h-8",
                    i === page
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "hover:bg-slate-100",
                  )}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPagesFiltered - 1}
                onClick={() =>
                  setPage((p) => Math.min(totalPagesFiltered - 1, p + 1))
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <ApproveLeaveDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(v) => !v && setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </>
  );
}
