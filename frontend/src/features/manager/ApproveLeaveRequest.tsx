import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
} from "lucide-react";

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

/* ================= TYPES ================= */

type LeaveRequest = {
  id: string;
  name: string;
  dept: string;
  type: "annual" | "sick" | "unpaid";
  time: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

/* ================= MOCK DATA ================= */

const MOCK_DATA: LeaveRequest[] = [
  {
    id: "LR-001",
    name: "Nguyễn Văn A",
    dept: "Kỹ thuật",
    type: "annual",
    time: "01/10 - 03/10",
    reason: "Việc gia đình cá nhân cần xử lý gấp...",
    status: "PENDING",
  },
  {
    id: "LR-002",
    name: "Trần Thị B",
    dept: "Marketing",
    type: "sick",
    time: "05/10 - 05/10",
    reason: "Khám bệnh định kỳ tại bệnh viện...",
    status: "PENDING",
  },
];

/* ================= TYPE BADGE ================= */

const renderLeaveType = (type: LeaveRequest["type"]) => {
  switch (type) {
    case "annual":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Nghỉ phép năm
        </Badge>
      );
    case "sick":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Nghỉ ốm
        </Badge>
      );
    case "unpaid":
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
          Nghỉ không lương
        </Badge>
      );
  }
};

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
  const [filterType, setFilterType] = useState<
    "all" | "annual" | "sick" | "unpaid"
  >("all");

  const [data, setData] = useState<LeaveRequest[]>(MOCK_DATA);
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  /* ================= FILTER LOGIC ================= */

  const filtered = data
    .filter((r) => r.status === "PENDING")
    .filter((r) => {
      const matchSearch = r.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchType =
        filterType === "all" ? true : r.type === filterType;

      return matchSearch && matchType;
    });

  /* ================= UPDATE STATUS ================= */

  const handleUpdateStatus = (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
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
              <h1 className="text-3xl font-bold">
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
                  {filterType === "all" && "Tất cả"}
                  {filterType === "annual" && "Nghỉ phép năm"}
                  {filterType === "sick" && "Nghỉ ốm"}
                  {filterType === "unpaid" && "Nghỉ không lương"}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  Tất cả
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("annual")}>
                  Nghỉ phép năm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("sick")}>
                  Nghỉ ốm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("unpaid")}>
                  Nghỉ không lương
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* TABLE */}
          <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
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
                {filtered.length === 0 ? (
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
                          <span className="font-semibold">
                            {row.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{row.dept}</TableCell>
                      <TableCell>
                        {renderLeaveType(row.type)}
                      </TableCell>
                      <TableCell>{row.time}</TableCell>

                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                          Chờ duyệt
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
        Xem chi tiết
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