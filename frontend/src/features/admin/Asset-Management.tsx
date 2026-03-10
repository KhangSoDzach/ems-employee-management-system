import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AssetDetailModal from "./AssetDetailModal";
import AssetCreateModal from "./AssetCreateModal";
import AssetEditModal from "./AssetEditModal";
import {
  assetService,
  AssetSummary,
  AssetStatus,
  ASSET_STATUS_LABELS,
  AssetDetail,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

const STATUS_FILTERS: { label: string; value: AssetStatus | "" }[] = [
  { label: SYSTEM_MESSAGES.ASSET.FILTER_ALL, value: "" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_AVAILABLE, value: "AVAILABLE" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_ASSIGNED, value: "ASSIGNED" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_RETURNED, value: "RETIRED" },
];

const PAGE_SIZE = 10;

/* ================= PAGE ================= */

export default function AssetManagementPage({
  sidebarRole = "admin",
}: {
  sidebarRole?: "admin" | "hr";
}) {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [totalElements, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);

  const handleOpenDetail = useCallback(async (summary: AssetSummary) => {
    setSelectedId(summary.id);
    setOpenDetail(true);
  }, []);

  const handleOpenEdit = useCallback(async (summary: AssetSummary) => {
    setLoading(true);
    try {
      const full = await assetService.getAssetById(summary.id);
      setSelectedId(summary.id);
      setSelectedAsset(full);
      setOpenEdit(true);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to first page when filter/search changes
  useEffect(() => { setPage(0); }, [statusFilter, searchDebounced]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assetService.listAssets({
        page,
        size: PAGE_SIZE,
        status: statusFilter || undefined,
        keyword: searchDebounced || undefined,
      });
      setAssets(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      toast.error(SYSTEM_MESSAGES.API_ERROR);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchDebounced]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = async (id: string) => {
    if (!confirm(SYSTEM_MESSAGES.BTN_DELETE + "?")) return;
    try {
      await assetService.deleteAsset(id);
      toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE);
      fetchList();
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    }
  };

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" role={sidebarRole} />

      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col p-6 gap-6 bg-gray-50 dark:bg-gray-950">
          {/* ===== HEADER ===== */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{SYSTEM_MESSAGES.ASSET.TITLE}</h1>

            <div className="flex items-center gap-4">
              <input
                placeholder={SYSTEM_MESSAGES.ASSET.SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 w-64 rounded-full bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => setOpenCreate(true)}
                className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90"
              >
                {SYSTEM_MESSAGES.ASSET.BTN_ADD}
              </button>
            </div>
          </div>

          {/* ===== FILTER TABS ===== */}
          <div className="flex gap-3">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${statusFilter === tab.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== TABLE ===== */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 text-left">{SYSTEM_MESSAGES.ASSET.TABLE_ID}</th>
                  <th className="px-6 py-4 text-left">{SYSTEM_MESSAGES.ASSET.TABLE_NAME}</th>
                  <th className="px-6 py-4 text-left">{SYSTEM_MESSAGES.ASSET.TABLE_TYPE}</th>
                  <th className="px-6 py-4 text-left">{SYSTEM_MESSAGES.ASSET.TABLE_STATUS}</th>
                  <th className="px-6 py-4 text-left">{SYSTEM_MESSAGES.ASSET.TABLE_USER}</th>
                  <th className="px-6 py-4 text-right">{SYSTEM_MESSAGES.ASSET.TABLE_ACTIONS}</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {SYSTEM_MESSAGES.LOADING}
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-gray-400">
                      {SYSTEM_MESSAGES.NO_DATA}
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">{asset.id}</td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{asset.name}</div>
                        {asset.desc && <div className="text-xs text-gray-500">{asset.desc}</div>}
                      </td>

                      <td className="px-6 py-4">{asset.type ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}</td>

                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${asset.statusColor}`}>
                          {ASSET_STATUS_LABELS[asset.status as AssetStatus] ?? asset.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">{asset.user ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}</td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 text-gray-500">
                          <Eye
                            size={18}
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleOpenDetail(asset)}
                          />
                          <Pencil
                            size={18}
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleOpenEdit(asset)}
                          />
                          <Trash2
                            size={18}
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => handleDelete(asset.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ===== PAGINATION ===== */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 text-sm">
              <div className="text-gray-500">
                {totalElements === 0
                  ? SYSTEM_MESSAGES.NO_DATA
                  : `${SYSTEM_MESSAGES.ASSET.PAGINATION_SHOW} ${from}–${to} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ON} ${totalElements} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ITEMS}`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = totalPages <= 5 ? i : Math.max(0, page - 2) + i;
                  if (pg >= totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-full font-bold ${pg === page ? "bg-primary text-white" : "hover:bg-gray-200"
                        }`}
                    >
                      {pg + 1}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>

        <AssetCreateModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={() => { fetchList(); setOpenCreate(false); }}
        />
        <AssetDetailModal
          open={openDetail}
          assetId={selectedId}
          onClose={() => setOpenDetail(false)}
          onChanged={fetchList}
        />
        <AssetEditModal
          open={openEdit}
          asset={selectedAsset}
          assetId={selectedId}
          onClose={() => setOpenEdit(false)}
          onSave={() => { fetchList(); setOpenEdit(false); }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
