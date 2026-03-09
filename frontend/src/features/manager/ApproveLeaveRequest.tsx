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
  ANNUAL:   { label: "Nghỉ phép năm",  cls: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  SICK:     { label: "Nghỉ ốm",        cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  UNPAID:   { label: "Nghỉ không lương", cls: "bg-rose-100 text-rose-700 hover:bg-rose-100" },
  PERSONAL: { label: "Việc riêng",     cls: "bg-violet-100 text-violet-700 hover:bg-violet-100" },
};

const renderLeaveType = (type: string) => {
  const cfg = LEAVE_TYPE_MAP[type] ?? { label: type, cls: "bg-muted text-muted-foreground" };
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
};

const isPending = (status: string) => status.startsWith("PENDING");

/* ================= EMPTY STATE ================= */

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={6} className="h-64 text-center">
      <p className="text-muted-foreground">
        Không có yêu cầu nghỉ phép nào đang chờ duyệt.
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
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  /* ================= LOAD TEAM LEAVES ================= */

  useEffect(() => {
    leaveService.getTeamLeaves()
      .then((page) => setData(page.content.map(mapDto)))
      .catch(() => toast.error("Không thể tải danh sách nghỉ phép."))
      .finally(() => setIsLoading(false));
  }, []);

  /* ================= FILTER LOGIC ================= */

  const filtered = data
    .filter((r) => isPending(r.status))
    .filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" ? true : r.leaveType === filterType.toUpperCase();
      return matchSearch && matchType;
    });

  /* ================= UPDATE STATUS LOCALLY ================= */

  const handleUpdateStatus = (id: number, status: string) => {
    setData((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
  };

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-heading">
                Danh sách nghỉ phép chờ duyệt
              </h1>
              <p className="text-muted-foreground mt-1">
                Xử lý các yêu cầu nghỉ phép từ nhân viên.
              </p>
            </div>
            <Button variant="outline">Xuất báo cáo</Button>
          </div>

          {/* FILTER BAR */}
          <div className="flex gap-3 items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {{ all: "Tất cả", annual: "Nghỉ phép năm", sick: "Nghỉ ốm", unpaid: "Nghỉ không lương", personal: "Việc riêng" }[filterType] ?? "Tất cả"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>Tất cả</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("annual")}>Nghỉ phép năm</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("sick")}>Nghỉ ốm</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("unpaid")}>Nghỉ không lương</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("personal")}>Việc riêng</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* TABLE */}
          <div className="card-soft">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Loại nghỉ</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Đang tải dữ liệu...</span>
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
                            <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.dept}</TableCell>
                      <TableCell>{renderLeaveType(row.leaveType)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(row.startDate + "T00:00:00"), "dd/MM")}
                        {row.startDate !== row.endDate && ` – ${format(new Date(row.endDate + "T00:00:00"), "dd/MM")}`}
                        {row.duration != null && (
                          <span className="ml-1 text-muted-foreground">({row.duration}n)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200">Chờ duyệt</Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedRequest(row)}>Xem chi tiết</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
              Hiển thị {filtered.length} yêu cầu
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