import { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  };
}

/* ================= TYPE BADGE ================= */

const LEAVE_TYPE_MAP: Record<string, { label: string; cls: string }> = {
  ANNUAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_ANNUAL,
    cls: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  SICK: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_SICK,
    cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
  UNPAID: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_UNPAID,
    cls: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  },
  PERSONAL: {
    label: SYSTEM_MESSAGES.LEAVE.TYPE_PERSONAL,
    cls: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  },
};

const renderLeaveType = (type: string) => {
  const cfg = LEAVE_TYPE_MAP[type] ?? {
    label: type,
    cls: "bg-muted text-muted-foreground",
  };
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
};

const isPending = (status: string) => status.startsWith("PENDING");

/* ================= EMPTY STATE ================= */

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-64 text-center">
      <p className="text-muted-foreground">
        {SYSTEM_MESSAGES.LEAVE.EMPTY_PENDING}
      </p>
    </TableCell>
  </TableRow>
);

/* ================= MAIN PAGE ================= */

export default function ApproveLeaveRequest() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );

  /* ================= LOAD TEAM LEAVES ================= */

  useEffect(() => {
    leaveService
      .getTeamLeaves()
      .then((page) => setData(page.content.map(mapDto)))
      .catch(() => toast.error(SYSTEM_MESSAGES.MGMT_ADJ.MSG_FETCH_ERROR))
      .finally(() => setIsLoading(false));
  }, []);

  /* ================= FILTER LOGIC ================= */

  const filtered = data
    .filter((r) => isPending(r.status))
    .filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchType =
        filterType === "all" ? true : r.leaveType === filterType.toUpperCase();
      return matchSearch && matchType;
    });

  /* ================= UPDATE STATUS LOCALLY ================= */

  const handleUpdateStatus = (id: number, status: string) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-heading">
                {SYSTEM_MESSAGES.APPROVE.LEAVE_LIST_TITLE}
              </h1>
              <p className="text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.APPROVE.LEAVE_LIST_DESC}
              </p>
            </div>
            <Button variant="outline">
              {SYSTEM_MESSAGES.APPROVE.BTN_EXPORT}
            </Button>
          </div>

          {/* FILTER BAR */}
          <div className="flex gap-3 items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={SYSTEM_MESSAGES.APPROVE.SEARCH_EMP}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {{
                    all: SYSTEM_MESSAGES.APPROVE.FILTER_ALL,
                    annual: SYSTEM_MESSAGES.LEAVE.TYPE_ANNUAL,
                    sick: SYSTEM_MESSAGES.LEAVE.TYPE_SICK,
                    unpaid: SYSTEM_MESSAGES.LEAVE.TYPE_UNPAID,
                    personal: SYSTEM_MESSAGES.LEAVE.TYPE_PERSONAL,
                  }[filterType] ?? SYSTEM_MESSAGES.APPROVE.FILTER_ALL}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  {SYSTEM_MESSAGES.APPROVE.FILTER_ALL}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("annual")}>
                  {SYSTEM_MESSAGES.LEAVE.TYPE_ANNUAL}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("sick")}>
                  {SYSTEM_MESSAGES.LEAVE.TYPE_SICK}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("unpaid")}>
                  {SYSTEM_MESSAGES.LEAVE.TYPE_UNPAID}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("personal")}>
                  {SYSTEM_MESSAGES.LEAVE.TYPE_PERSONAL}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* TABLE */}
          <div className="card-soft">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>{SYSTEM_MESSAGES.APPROVE.TABLE_COL_EMP}</TableHead>
                  <TableHead>
                    {SYSTEM_MESSAGES.APPROVE.TABLE_COL_DEPT}
                  </TableHead>
                  <TableHead>
                    {SYSTEM_MESSAGES.APPROVE.TABLE_COL_TYPE}
                  </TableHead>
                  <TableHead>
                    {SYSTEM_MESSAGES.APPROVE.TABLE_COL_TIME}
                  </TableHead>
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
                ) : filtered.length === 0 ? (
                  <EmptyState />
                ) : (
                  filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedRequest(row)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {row.name.charAt(0)}
                            </AvatarFallback>
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
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                          {SYSTEM_MESSAGES.STATUS.PENDING}
                        </Badge>
                      </TableCell>
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

            <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_PREFIX} {filtered.length}{" "}
              {SYSTEM_MESSAGES.APPROVE.DISPLAY_UNIT}
            </div>
          </div>
        </main>
      </SidebarInset>

      {/* SHEET */}
      <ApproveLeaveDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(v) => !v && setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </SidebarProvider>
  );
}
