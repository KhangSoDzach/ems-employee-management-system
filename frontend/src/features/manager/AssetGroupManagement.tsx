import { useState, useEffect, useCallback } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { toast } from "sonner";

import {
  assetService,
  AssetSummary,
  AssetStatus,
  ASSET_STATUS_LABELS,
  ASSET_STATUS_COLORS,
} from "@/services/assetService";

const PAGE_SIZE = 15;

const StatusBadge = ({ status }: { status: string }) => {
  const label = ASSET_STATUS_LABELS[status as AssetStatus] ?? status;
  const cls   = ASSET_STATUS_COLORS[status as AssetStatus] ?? "bg-slate-100 text-slate-600";
  return <Badge className={`${cls} hover:${cls} text-xs font-semibold`}>{label}</Badge>;
};

export default function AssetGroupManagement() {
  const [assets, setAssets]         = useState<AssetSummary[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(false);

  const [search, setSearch]               = useState("");
  const [searchDebounced, setSearchDB]    = useState("");
  const [statusFilter, setStatusFilter]   = useState<AssetStatus | "">("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDB(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [statusFilter, searchDebounced]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assetService.listAssets({
        page, size: PAGE_SIZE,
        status:  statusFilter || undefined,
        keyword: searchDebounced || undefined,
      });
      setAssets(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch { toast.error("Không thể tải tài sản nhóm"); }
    finally { setLoading(false); }
  }, [page, statusFilter, searchDebounced]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return (
    <SidebarProvider>
      <AppSidebar role="manager" variant="inset" />

      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Tài sản nhóm quản lý</h1>
              <p className="text-muted-foreground mt-1">
                Theo dõi thiết bị đang được cấp phát trong nhóm của bạn
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-semibold text-2xl">{total}</p>
              <p>tài sản trong nhóm</p>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Tìm kiếm tài sản..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                  {statusFilter ? ASSET_STATUS_LABELS[statusFilter] : "Tất cả trạng thái"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("")}>Tất cả</DropdownMenuItem>
                {(Object.keys(ASSET_STATUS_LABELS) as AssetStatus[]).map(s => (
                  <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                    {ASSET_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* TABLE */}
          <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Mã tài sản</TableHead>
                  <TableHead>Tên tài sản</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Đang gán cho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải...
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      Không có tài sản nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-muted-foreground">{asset.id}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{asset.name}</div>
                        {asset.desc && <div className="text-xs text-muted-foreground">{asset.desc}</div>}
                      </TableCell>
                      <TableCell>{asset.type ?? "—"}</TableCell>
                      <TableCell>
                        {asset.user ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{asset.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {asset.user}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={asset.status} /></TableCell>
                      <TableCell align="right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>Xem chi tiết</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {total === 0 ? "Không có dữ liệu" : `${total} tài sản trong nhóm`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-muted-foreground">Trang {page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-40">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


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
import { AssetDetailSheet } from "./components/AssetDetailSheet";
/* ================= TYPES ================= */

type Asset = {
  id: string;
  code: string;
  name: string;
  type: string;
  assignedTo: string;
  assignedDate: string;
  status: "new" | "normal" | "maintenance";
};

/* ================= MOCK DATA ================= */

const MOCK_DATA: Asset[] = [
  {
    id: "1",
    code: "TS-2023-001",
    name: 'MacBook Pro M2 14"',
    type: "Laptop",
    assignedTo: "Linh Nguyễn",
    assignedDate: "12/01/2023",
    status: "new",
  },
  {
    id: "2",
    code: "TS-2023-042",
    name: "Dell UltraSharp U2723QE",
    type: "Màn hình",
    assignedTo: "Hải Phạm",
    assignedDate: "05/02/2023",
    status: "normal",
  },
  {
    id: "3",
    code: "TS-2022-089",
    name: "Logitech MX Master 3S",
    type: "Chuột",
    assignedTo: "Đức Anh",
    assignedDate: "20/11/2022",
    status: "maintenance",
  },
];

/* ================= STATUS BADGE ================= */

const renderStatus = (status: Asset["status"]) => {
  switch (status) {
    case "new":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Mới
        </Badge>
      );
    case "normal":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Bình thường
        </Badge>
      );
    case "maintenance":
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
          Cần bảo trì
        </Badge>
      );
  }
};

/* ================= EMPTY STATE ================= */

const EmptyState = () => (
  <TableRow>
    <TableCell colSpan={7} className="h-40 text-center">
      <p className="text-muted-foreground">Không có tài sản nào phù hợp.</p>
    </TableCell>
  </TableRow>
);

/* ================= MAIN PAGE ================= */

export default function AssetGroupManagement() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [data] = useState<Asset[]>(MOCK_DATA);

  /* ================= FILTER LOGIC ================= */

  const filtered = data.filter((asset) => {
    const matchSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.code.toLowerCase().includes(search.toLowerCase());

    const matchType = filterType === "all" ? true : asset.type === filterType;

    return matchSearch && matchType;
  });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (asset: Asset) => {
    setSelectedAsset(asset);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
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
              <h1 className="text-3xl font-bold">Tài sản nhóm quản lý</h1>
              <p className="text-muted-foreground mt-1">
                Quản lý và theo dõi trang thiết bị của bộ phận
              </p>
            </div>
          </div>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tổng tài sản */}
            <div className="card-elevated-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-title-muted font-medium">
                    Tổng tài sản nhóm
                  </p>
                  <h3 className="text-3xl font-bold mt-1">128</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    +4 trong tháng này
                  </p>
                </div>

                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">📦</span>
                </div>
              </div>
            </div>

            {/* Đang sử dụng */}
            <div className="card-elevated-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-title-muted font-medium">
                    Đang sử dụng
                  </p>
                  <h3 className="text-3xl font-bold mt-1">115</h3>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    89.8% công suất
                  </p>
                </div>

                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  👤
                </div>
              </div>
            </div>

            {/* Cần bảo trì */}
            <div className="bg-card rounded-2xl border border-l-4 border-l-red-500 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-title-muted font-medium">
                    Cần bảo trì
                  </p>
                  <h3 className="text-3xl font-bold mt-1 text-red-600">13</h3>
                  <p className="text-xs text-red-600 mt-2 font-semibold uppercase">
                    Cần xử lý gấp
                  </p>
                </div>

                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  🛠
                </div>
              </div>
            </div>
          </div>
          {/* FILTER BAR */}
          <div className="flex gap-3 items-center">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tài sản..."
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
                  {filterType === "all" ? "Tất cả loại" : filterType}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  Tất cả
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Laptop")}>
                  Laptop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Màn hình")}>
                  Màn hình
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Chuột")}>
                  Chuột
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* TABLE */}
          <div className="bg-background rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Mã tài sản</TableHead>
                  <TableHead>Tên tài sản</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Đang gán cho</TableHead>
                  <TableHead>Ngày cấp</TableHead>
                  <TableHead>Tình trạng</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <EmptyState />
                ) : (
                  filtered.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => openSheet(asset)}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {asset.code}
                      </TableCell>

                      <TableCell className="font-semibold">
                        {asset.name}
                      </TableCell>

                      <TableCell>{asset.type}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {asset.assignedTo.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {asset.assignedTo}
                        </div>
                      </TableCell>

                      <TableCell>{asset.assignedDate}</TableCell>

                      <TableCell>{renderStatus(asset.status)}</TableCell>

                      <TableCell align="right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openSheet(asset)}>
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
              Hiển thị {filtered.length} tài sản
            </div>
          </div>
        </main>

      </SidebarInset>
      <AssetDetailSheet
  asset={selectedAsset}
  open={sheetOpen}
  onClose={closeSheet}
/>
    </SidebarProvider>
  );
}
