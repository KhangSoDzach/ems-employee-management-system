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
import { SYSTEM_MESSAGES } from "@/constants/messages";

const PAGE_SIZE = 15;

const StatusBadge = ({ status }: { status: string }) => {
  const label = ASSET_STATUS_LABELS[status as AssetStatus] ?? status;
  const cls = ASSET_STATUS_COLORS[status as AssetStatus] ?? "bg-slate-100 text-slate-600";
  return <Badge className={`${cls} hover:${cls} text-xs font-semibold`}>{label}</Badge>;
};

export default function AssetGroupManagement() {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDB] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");

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
        status: statusFilter || undefined,
        keyword: searchDebounced || undefined,
      });
      setAssets(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch { toast.error(SYSTEM_MESSAGES.ASSET_GROUP.FETCH_ERROR); }
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
              <h1 className="page-heading">{SYSTEM_MESSAGES.ASSET_GROUP.TITLE}</h1>
              <p className="text-muted-foreground mt-1">
                {SYSTEM_MESSAGES.ASSET_GROUP.TITLE_DESC}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p className="font-semibold text-2xl">{total}</p>
              <p>{SYSTEM_MESSAGES.ASSET_GROUP.STATS_UNIT}</p>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={SYSTEM_MESSAGES.ASSET.SEARCH_PLACEHOLDER} value={search}
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
                  {statusFilter ? ASSET_STATUS_LABELS[statusFilter] : SYSTEM_MESSAGES.ASSET_GROUP.FILTER_STATUS_ALL}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("")}>{SYSTEM_MESSAGES.ASSET_GROUP.FILTER_ALL}</DropdownMenuItem>
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
                  <TableHead>{SYSTEM_MESSAGES.ASSET.TABLE_ID}</TableHead>
                  <TableHead>{SYSTEM_MESSAGES.ASSET.TABLE_NAME}</TableHead>
                  <TableHead>{SYSTEM_MESSAGES.ASSET.TABLE_TYPE}</TableHead>
                  <TableHead>{SYSTEM_MESSAGES.ASSET_GROUP.TABLE_ASSIGNED_TO}</TableHead>
                  <TableHead>{SYSTEM_MESSAGES.ASSET.TABLE_STATUS}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> {SYSTEM_MESSAGES.LOADING}
                    </TableCell>
                  </TableRow>
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      {SYSTEM_MESSAGES.ADJUSTMENT.EMPTY_FILTER_TITLE}
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
                        ) : <span className="text-muted-foreground">{SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}</span>}
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
                            <DropdownMenuItem disabled>{SYSTEM_MESSAGES.MGMT_ADJ.BTN_DETAIL}</DropdownMenuItem>
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
                {total === 0 ? SYSTEM_MESSAGES.NO_DATA : `${total} ${SYSTEM_MESSAGES.ASSET_GROUP.STATS_UNIT}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-muted-foreground">{SYSTEM_MESSAGES.ASSET_GROUP.PAGE_PREFIX}{page + 1} {SYSTEM_MESSAGES.SYMBOLS.SLASH} {totalPages}</span>
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
