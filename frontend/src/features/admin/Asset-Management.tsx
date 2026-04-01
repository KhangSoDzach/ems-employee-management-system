import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import AssetDetailSheet from "./components/AssetDetailSheet";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const STATUS_FILTERS: { label: string; value: AssetStatus | "" }[] = [
  { label: SYSTEM_MESSAGES.ASSET.FILTER_ALL, value: "" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_AVAILABLE, value: "AVAILABLE" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_ASSIGNED, value: "ASSIGNED" },
  { label: SYSTEM_MESSAGES.ASSET.FILTER_RETURNED, value: "RETIRED" },
];

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number | string;
    name: string;
    status: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resolveAssetIdentifier = useCallback(
    (summary: AssetSummary): number | string | null => {
      if (summary.dbId !== null && summary.dbId !== undefined) {
        return summary.dbId;
      }
      if (summary.id && summary.id.trim().length > 0) {
        return summary.id;
      }
      return null;
    },
    [],
  );

  const handleOpenDetail = useCallback(
    async (summary: AssetSummary) => {
      const identifier = resolveAssetIdentifier(summary);
      if (identifier === null || identifier === undefined) {
        toast.error(SYSTEM_MESSAGES.ERROR);
        return;
      }
      setSelectedId(identifier);
      setOpenDetail(true);
    },
    [resolveAssetIdentifier],
  );

  const handleOpenEdit = useCallback(
    async (summary: AssetSummary) => {
      const identifier = resolveAssetIdentifier(summary);
      if (identifier === null || identifier === undefined) {
        toast.error(SYSTEM_MESSAGES.ERROR);
        return;
      }
      setLoading(true);
      try {
        const full = await assetService.getAssetById(identifier);
        setSelectedId(full.id ?? identifier);
        setSelectedAsset(full);
        setOpenEdit(true);
      } catch {
        toast.error(SYSTEM_MESSAGES.ERROR);
      } finally {
        setLoading(false);
      }
    },
    [resolveAssetIdentifier],
  );

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchDebounced]);

  const fetchList = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await assetService.listAssets({
          page,
          size: PAGE_SIZE,
          status: statusFilter || undefined,
          keyword: searchDebounced || undefined,
        });

        if (signal?.aborted) {
          return;
        }
        setAssets(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
      } catch (err: unknown) {
        if (signal?.aborted) {
          return;
        }
        const name = (err as { name?: string })?.name;
        if (name !== "AbortError" && name !== "CanceledError") {
          toast.error(SYSTEM_MESSAGES.API_ERROR);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [page, statusFilter, searchDebounced],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [fetchList]);

  const handleDelete = (id: number | string, name: string, status: string) => {
    setDeleteTarget({ id, name, status });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await assetService.deleteAsset(deleteTarget.id);
      toast.success(SYSTEM_MESSAGES.ASSET.MSG_DELETE_SUCCESS);
      setDeleteTarget(null);
      fetchList();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg ?? SYSTEM_MESSAGES.ASSET.MSG_DELETE_ERROR);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportAssets = async () => {
    try {
      setLoading(true);
      const blob = await assetService.exportAssets({
        status: statusFilter || undefined,
        keyword: searchDebounced || undefined,
      });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `danh-sach-tai-san-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
      toast.success(SYSTEM_MESSAGES.SUCCESS_UPDATE);
    } catch {
      toast.error(SYSTEM_MESSAGES.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <>
      <main className="flex flex-1 flex-col p-6 gap-6 bg-background">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <h1 className="page-heading">{SYSTEM_MESSAGES.ASSET.TITLE}</h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                placeholder={SYSTEM_MESSAGES.ASSET.SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-search"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
            <button
              onClick={handleExportAssets}
              disabled={loading}
              className="px-5 py-2 flex items-center justify-center bg-muted border border-border text-muted-foreground rounded-full font-semibold hover:bg-muted/80 transition gap-2"
              title={SYSTEM_MESSAGES.ASSET.TITLE_DOWNLOAD_CSV}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setOpenCreate(true)}
              className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20"
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
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== TABLE ===== */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">
                  {SYSTEM_MESSAGES.ASSET.TABLE_ID}
                </th>
                <th className="px-6 py-4 text-left">
                  {SYSTEM_MESSAGES.ASSET.TABLE_NAME}
                </th>
                <th className="px-6 py-4 text-left">
                  {SYSTEM_MESSAGES.ASSET.TABLE_TYPE}
                </th>
                <th className="px-6 py-4 text-left">
                  {SYSTEM_MESSAGES.ASSET.TABLE_STATUS}
                </th>
                <th className="px-6 py-4 text-left">
                  {SYSTEM_MESSAGES.ASSET.TABLE_USER}
                </th>
                <th className="px-6 py-4 text-right">
                  {SYSTEM_MESSAGES.ASSET.TABLE_ACTIONS}
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    {SYSTEM_MESSAGES.LOADING}
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    {SYSTEM_MESSAGES.NO_DATA}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => handleOpenDetail(asset)}
                    className="border-t border-border/50 hover:bg-muted/50 transition group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">
                      {asset.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">
                        {asset.name}
                      </div>
                      {asset.desc && (
                        <div className="text-xs text-muted-foreground italic">
                          {asset.desc}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground">
                      {asset.type ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border ${asset.statusColor}`}
                      >
                        {ASSET_STATUS_LABELS[asset.status as AssetStatus] ??
                          asset.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-foreground font-medium">
                      {asset.user ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 text-muted-foreground">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(asset);
                          }}
                          className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(asset);
                          }}
                          className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const identifier = resolveAssetIdentifier(asset);
                            if (
                              identifier === null ||
                              identifier === undefined
                            ) {
                              toast.error(SYSTEM_MESSAGES.ERROR);
                              return;
                            }
                            handleDelete(
                              identifier,
                              asset.name,
                              asset.status?.toUpperCase() ?? "",
                            );
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ===== PAGINATION ===== */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 text-xs">
            <div className="text-muted-foreground font-medium uppercase tracking-wider">
              {totalElements === 0
                ? SYSTEM_MESSAGES.NO_DATA
                : `${SYSTEM_MESSAGES.ASSET.PAGINATION_SHOW} ${from}–${to} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ON} ${totalElements} ${SYSTEM_MESSAGES.ASSET.PAGINATION_ITEMS}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i : Math.max(0, page - 2) + i;
                if (pg >= totalPages) {
                  return null;
                }
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-xl font-black ${
                      pg === page
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted disabled:opacity-40"
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
        onCreated={() => {
          fetchList();
          setOpenCreate(false);
        }}
      />
      <AssetDetailSheet
        open={openDetail}
        assetId={selectedId}
        onClose={() => setOpenDetail(false)}
        onChanged={fetchList}
      />
      <AssetEditModal
        open={openEdit}
        assetId={
          selectedAsset?.id ??
          (typeof selectedId === "number" ? selectedId : null)
        }
        onClose={() => setOpenEdit(false)}
        onUpdated={() => {
          fetchList();
          setOpenEdit(false);
        }}
      />

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive uppercase font-black tracking-tight">
              <AlertTriangle className="w-5 h-5" />
              {deleteTarget?.status?.toUpperCase() === "ASSIGNED"
                ? SYSTEM_MESSAGES.ASSET.MSG_CANNOT_DELETE
                : SYSTEM_MESSAGES.ASSET.MSG_CONFIRM_DELETE}
            </DialogTitle>
            <DialogDescription
              className="pt-2 text-muted-foreground font-medium"
              asChild
            >
              <div>
                {deleteTarget?.status?.toUpperCase() === "ASSIGNED" ? (
                  // ASSIGNED: show guidance to return first
                  <div className="space-y-4">
                    <p>
                      Tài sản{" "}
                      <span className="font-bold text-foreground">
                        "{deleteTarget?.name}"
                      </span>{" "}
                      {SYSTEM_MESSAGES.ASSET.MSG_DELETE_WARNING}
                      <span className="font-bold text-amber-500 underline underline-offset-4">
                        {SYSTEM_MESSAGES.ASSET.MSG_STEP_2}
                      </span>
                      .
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs">
                      <p className="font-black text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.ASSET.MSG_HOW_TO}
                      </p>
                      <p className="text-amber-700/80 dark:text-amber-200/60 leading-relaxed font-bold">
                        {SYSTEM_MESSAGES.ASSET.MSG_STEP_1}
                        <span className="text-amber-600 dark:text-amber-400 font-black">
                          {SYSTEM_MESSAGES.ASSET.MSG_STEP_2}
                        </span>
                        {SYSTEM_MESSAGES.ASSET.MSG_STEP_3}
                      </p>
                    </div>
                  </div>
                ) : (
                  // AVAILABLE / RETIRED: normal confirm
                  <div className="space-y-2">
                    <p>
                      {SYSTEM_MESSAGES.ASSET.MSG_DELETE_CONFIRM}
                      <span className="font-bold text-foreground mx-1">
                        "{deleteTarget?.name}"
                      </span>
                      ?
                    </p>
                    <p className="text-xs text-destructive font-black uppercase tracking-widest bg-destructive/10 px-3 py-1 rounded-full inline-block">
                      {SYSTEM_MESSAGES.ASSET.MSG_DELETE_IRREVERSIBLE}
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-6">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="btn-secondary flex-1"
            >
              {SYSTEM_MESSAGES.ASSET.BTN_CLOSE}
            </button>
            {deleteTarget?.status?.toUpperCase() === "ASSIGNED" ? (
              // Guide to open detail modal for return
              <button
                onClick={() => {
                  const asset = assets.find((a) => {
                    const id = resolveAssetIdentifier(a);
                    return id === deleteTarget?.id;
                  });
                  if (asset) {
                    setDeleteTarget(null);
                    handleOpenDetail(asset);
                  }
                }}
                className="btn-action flex-1"
              >
                {SYSTEM_MESSAGES.ASSET.BTN_OPEN_DETAIL}
              </button>
            ) : (
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="btn-action flex-1 bg-destructive text-destructive-foreground"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting
                  ? SYSTEM_MESSAGES.LOADING_SHORT
                  : SYSTEM_MESSAGES.ASSET.BTN_DELETE}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
