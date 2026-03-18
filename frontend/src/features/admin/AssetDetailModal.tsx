import { useState, useEffect } from "react";
import { X, MapPin, History, Loader2, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";
import AssetFullHistoryModal from "./AssetFullHistoryModal";
import {
  assetService,
  AssetDetail,
  AssetCondition,
  EmployeeOption,
  ASSET_STATUS_LABELS,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
  open: boolean;
  assetId: string | number | null;
  onClose: () => void;
  onChanged: () => void;
}

const CONDITION_COLORS: Record<AssetCondition, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-emerald-100 text-emerald-700",
  DAMAGED: "bg-amber-100 text-amber-700",
  LOST: "bg-red-100 text-red-700",
  DISPOSED: "bg-slate-200 text-slate-700",
};

export default function AssetDetailModal({ open, assetId, onClose, onChanged }: Props) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  // Assign dialog state
  const [showAssign, setShowAssign] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeOption | null>(null);
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Return dialog state
  const [showReturn, setShowReturn] = useState(false);
  const [returnCond, setReturnCond] = useState<AssetCondition>("GOOD");
  const [readyReuse, setReadyReuse] = useState(true);
  const [returnNote, setReturnNote] = useState("");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!open || !assetId) {
      setAsset(null);
      return;
    }
    setLoading(true);
    assetService.getAssetById(assetId)
      .then(setAsset)
      .catch(() => toast.error(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_FETCH_ERROR))
      .finally(() => setLoading(false));
  }, [open, assetId]);

  useEffect(() => {
    if (!showAssign) {
      return;
    }
    const t = setTimeout(() => {
      setEmpLoading(true);
      assetService.searchEmployees(empSearch)
        .then(r => setEmployees(r.content))
        .catch(() => { })
        .finally(() => setEmpLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch, showAssign]);

  if (!open) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedEmp || !assetId) {
      return;
    }
    setAssigning(true);
    try {
      await assetService.assignAsset(assetId, {
        employeeId: selectedEmp.id,
        notes: assignNote || undefined
      });
      toast.success(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_ASSIGN_SUCCESS);
      setShowAssign(false); setSelectedEmp(null); setAssignNote(""); setEmpSearch("");
      const updated = await assetService.getAssetById(assetId);
      setAsset(updated);
      onChanged();
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_ASSIGN_ERROR);
    } finally {
      setAssigning(false);
    }
  };

  const handleReturn = async () => {
    if (!assetId) {
      return;
    }
    setReturning(true);
    try {
      await assetService.returnAsset(assetId, {
        conditionOnReturn: returnCond,
        readyToReuse: readyReuse,
        notes: returnNote || undefined
      });
      toast.success(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_RETURN_SUCCESS);
      setShowReturn(false); setReturnNote("");
      const updated = await assetService.getAssetById(assetId);
      setAsset(updated);
      onChanged();
    } catch {
      toast.error(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_RETURN_ERROR);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{asset?.name ?? SYSTEM_MESSAGES.ASSET_DETAIL.TITLE}</h2>
            <p className="text-xs text-slate-500 font-mono">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CODE}{SYSTEM_MESSAGES.SYMBOLS.COLON}{asset?.code ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:text-primary"><X size={20} /></button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/40">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" /> {SYSTEM_MESSAGES.APPROVE.LOADING}
            </div>
          ) : !asset ? null : (
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm overflow-hidden">
                  <div className="aspect-video bg-slate-100 relative flex items-center justify-center text-slate-300">
                    {asset.imageUrl ? (
                      <img src={asset.imageUrl} alt="asset" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">
                        {SYSTEM_MESSAGES.ASSET_DETAIL.TXT_PACKAGE_ICON}
                      </span>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {ASSET_STATUS_LABELS[asset.status] ?? asset.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {asset.status === "AVAILABLE" && (
                      <button onClick={() => { setShowAssign(true); setEmpSearch(""); }}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                        <UserCheck size={16} /> {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_ASSIGN}
                      </button>
                    )}
                    {asset.status === "ASSIGNED" && (
                      <button onClick={() => setShowReturn(true)}
                        className="w-full bg-slate-100 hover:bg-slate-200 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                        <UserX size={16} /> {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_RETURN}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm p-4">
                  <h3 className="text-sm font-bold mb-3">{SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_SUPPORT}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_WARRANTY}{SYSTEM_MESSAGES.ASSET_DETAIL.TXT_COLON_NOSPACE}</span><span>{asset.warranty ?? SYSTEM_MESSAGES.ASSET_DETAIL.TXT_DASH}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_SUPPLIER}{SYSTEM_MESSAGES.ASSET_DETAIL.TXT_COLON_NOSPACE}</span><span>{asset.supplier ?? SYSTEM_MESSAGES.ASSET_DETAIL.TXT_DASH}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONTRACT}{SYSTEM_MESSAGES.ASSET_DETAIL.TXT_COLON_NOSPACE}</span><span className="text-primary">{asset.contract ?? SYSTEM_MESSAGES.ASSET_DETAIL.TXT_DASH}</span></div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                  <div className="px-4 py-3 border-b"><h3 className="font-bold text-sm">{SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_BASIC}</h3></div>
                  <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CODE}</p><p className="font-medium">{asset.code}</p></div>
                    <div><p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_TYPE}</p><p className="font-medium">{asset.type ?? "—"}</p></div>
                    <div><p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_VALUE}</p><p className="font-medium">{asset.value ?? "—"}</p></div>
                    <div><p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_PURCHASE_DATE}</p><p className="font-medium">{asset.purchaseDate ?? "—"}</p></div>
                    <div>
                      <p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONDITION}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${CONDITION_COLORS[asset.condition] ?? ""}`}>
                        {ASSET_CONDITION_LABELS[asset.condition] ?? asset.condition}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs flex items-center gap-1"><MapPin size={12} /> {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_LOCATION_USER}</p>
                      <p className="font-medium text-slate-700">{asset.location ?? "—"}</p>
                    </div>
                    {asset.description && (
                      <div className="col-span-2 md:col-span-3 pt-3 border-t">
                        <p className="text-slate-400 text-xs mb-2">{SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_DESC_DETAIL}</p>
                        <p className="text-slate-600 leading-relaxed">{asset.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* HISTORY PREVIEW */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-bold text-sm">{SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_HISTORY}</h3>
                    <History size={18} />
                  </div>
                  <div className="p-5 space-y-4 text-sm">
                    {asset.recentHistory?.length ? asset.recentHistory.map(h => (
                      <div key={h.id} className="border-l-2 border-primary pl-4">
                        <p className="font-semibold">{h.action}</p>
                        {/* eslint-disable-next-line react/jsx-no-literals */}
                        <p className="text-slate-500 text-xs">{h.date} · {h.user}</p>
                        <p className="text-slate-600">{h.description}</p>
                      </div>
                    )) : <p className="text-slate-400 text-xs">{SYSTEM_MESSAGES.ASSET_DETAIL.TXT_NO_HISTORY}</p>}
                  </div>
                  <button onClick={() => setOpenHistory(true)}
                    className="w-full border-t py-2 text-xs text-slate-500 hover:text-primary">
                    {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_VIEW_HISTORY}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ASSIGN DIALOG */}
      {
        showAssign && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{SYSTEM_MESSAGES.ASSET_DETAIL.BTN_ASSIGN}</h3>
                <button onClick={() => setShowAssign(false)}><X size={18} /></button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder={SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_EMP} value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {empLoading ? <div className="text-center py-4 text-gray-400"><Loader2 className="animate-spin mx-auto" /></div>
                  : employees.map(e => (
                    <div key={e.id} onClick={() => setSelectedEmp(e)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedEmp?.id === e.id ? "bg-primary/10 border border-primary" : "hover:bg-gray-50"}`}>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {e.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{e.firstName} {e.lastName}</p>
                        {/* eslint-disable-next-line react/jsx-no-literals */}
                        <p className="text-xs text-gray-500">{e.department ?? ""} · {e.position ?? ""}</p>
                      </div>
                    </div>
                  ))}
              </div>
              <textarea rows={2} placeholder={SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_NOTE} value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAssign(false)} className="px-4 py-2 text-sm border rounded-md">{SYSTEM_MESSAGES.BTN_CANCEL}</button>
                <button onClick={handleAssign} disabled={!selectedEmp || assigning}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md flex items-center gap-2 disabled:opacity-60">
                  {assigning && <Loader2 size={14} className="animate-spin" />} {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_CONFIRM_ASSIGN}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* RETURN DIALOG */}
      {
        showReturn && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{SYSTEM_MESSAGES.ASSET_DETAIL.BTN_RETURN}</h3>
                <button onClick={() => setShowReturn(false)}><X size={18} /></button>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{SYSTEM_MESSAGES.ASSET_DETAIL.TXT_CONDITION_RETURN}</label>
                <select value={returnCond} onChange={(e) => setReturnCond(e.target.value as AssetCondition)}
                  className="w-full border rounded-md px-3 py-2 text-sm">
                  {(Object.keys(ASSET_CONDITION_LABELS) as AssetCondition[]).map(c => (
                    <option key={c} value={c}>{ASSET_CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={readyReuse} onChange={(e) => setReadyReuse(e.target.checked)} />
                {SYSTEM_MESSAGES.ASSET_DETAIL.TXT_READY_REUSE}
              </label>
              <textarea rows={2} placeholder={SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_NOTE} value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowReturn(false)} className="px-4 py-2 text-sm border rounded-md">{SYSTEM_MESSAGES.BTN_CANCEL}</button>
                <button onClick={handleReturn} disabled={returning}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md flex items-center gap-2 disabled:opacity-60">
                  {returning && <Loader2 size={14} className="animate-spin" />} {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_CONFIRM_RETURN}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <AssetFullHistoryModal
        open={openHistory}
        assetId={assetId}
        onClose={() => setOpenHistory(false)}
      />
    </div >
  );
}
