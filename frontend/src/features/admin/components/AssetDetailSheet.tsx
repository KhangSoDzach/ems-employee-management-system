import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Loader2,
  UserCheck,
  UserX,
  Search,
  Package,
  Calendar,
  DollarSign,
  ShieldCheck,
  Truck,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  assetService,
  type AssetDetail,
  type AssetStatus,
  type AssetCondition,
  type EmployeeOption,
  ASSET_STATUS_LABELS,
  ASSET_CONDITION_LABELS,
} from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { cn } from "@/lib/utils";

interface AssetDetailSheetProps {
  open: boolean;
  assetId: string | number | null;
  onClose: () => void;
  onChanged: () => void;
}

const CONDITION_COLORS: Record<AssetCondition, string> = {
  NEW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  GOOD: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  DAMAGED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOST: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  DISPOSED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export default function AssetDetailSheet({
  open,
  assetId,
  onClose,
  onChanged,
}: AssetDetailSheetProps) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(false);

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
    assetService
      .getAssetById(assetId)
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
      assetService
        .searchEmployees(empSearch)
        .then((r) => setEmployees(r.content))
        .catch(() => {})
        .finally(() => setEmpLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [empSearch, showAssign]);

  const handleAssign = async () => {
    if (!selectedEmp || !assetId) {
      return;
    }
    setAssigning(true);
    try {
      await assetService.assignAsset(assetId, {
        employeeId: selectedEmp.id,
        notes: assignNote || undefined,
      });
      toast.success(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_ASSIGN_SUCCESS);
      setShowAssign(false);
      setSelectedEmp(null);
      setAssignNote("");
      setEmpSearch("");
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
        notes: returnNote || undefined,
      });
      toast.success(SYSTEM_MESSAGES.ASSET_DETAIL.MSG_RETURN_SUCCESS);
      setShowReturn(false);
      setReturnNote("");
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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl  p-0 bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-bold uppercase tracking-widest text-[10px]">
              {SYSTEM_MESSAGES.APPROVE.LOADING}
            </p>
          </div>
        ) : !asset ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
            <AlertCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">
              {SYSTEM_MESSAGES.ASSET_DETAIL.MSG_NOT_FOUND}
            </p>
          </div>
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="px-8 pt-16 pb-12 bg-background border-b border-border text-foreground relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Package className="w-56 h-56 stroke-[0.5] text-primary" />
              </div>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-none",
                      asset.status === "AVAILABLE"
                        ? "bg-emerald-500 text-white"
                        : asset.status === "ASSIGNED"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-500 text-white",
                    )}
                  >
                    {ASSET_STATUS_LABELS[asset.status as AssetStatus] ??
                      asset.status}
                  </Badge>
                  <span className="font-black text-muted-foreground text-sm tracking-tighter uppercase font-mono">
                    {SYSTEM_MESSAGES.SYMBOLS.HASH}
                    {asset.code}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-4xl font-black tracking-tighter leading-none mb-3 text-foreground">
                    {asset.name}
                  </h2>
                  <div className="flex items-center gap-4 text-muted-foreground font-bold text-[11px] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {asset.location ?? "—"}
                    </div>
                    {asset.type && (
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-primary" />
                        {asset.type}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-background">
              {/* Image & Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="aspect-square bg-muted rounded-3xl overflow-hidden border-2 border-border shadow-sm group">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={SYSTEM_MESSAGES.ASSET.PREFIX_ASSET}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                      <Package className="w-20 h-20 stroke-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">
                        {SYSTEM_MESSAGES.ASSET_DETAIL.TXT_PACKAGE_ICON}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_BASIC}
                    </h4>
                    <div className="bg-muted/30 p-5 rounded-3xl border border-border/50 grid grid-cols-1 gap-4">
                      <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign size={14} />
                          <span className="text-[11px] font-bold uppercase tracking-tight">
                            {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_VALUE}
                          </span>
                        </div>
                        <span className="font-black text-foreground tracking-tight text-sm">
                          {asset.value ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={14} />
                          <span className="text-[11px] font-bold uppercase tracking-tight">
                            {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_PURCHASE_DATE}
                          </span>
                        </div>
                        <span className="font-bold text-foreground text-sm">
                          {asset.purchaseDate ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ShieldCheck size={14} />
                          <span className="text-[11px] font-bold uppercase tracking-tight">
                            {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONDITION}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            CONDITION_COLORS[asset.condition],
                          )}
                        >
                          {ASSET_CONDITION_LABELS[
                            asset.condition as AssetCondition
                          ] ?? asset.condition}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions Context */}
                  <div className="mt-auto space-y-3">
                    {asset.status === "AVAILABLE" ? (
                      <Button
                        onClick={() => {
                          setShowAssign(true);
                          setEmpSearch("");
                        }}
                        className="w-full h-14 bg-primary hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                      >
                        <UserCheck size={16} />{" "}
                        {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_ASSIGN}
                      </Button>
                    ) : asset.status === "ASSIGNED" ? (
                      <div className="space-y-4">
                        <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-3xl flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black">
                            {asset.recentHistory?.[0]?.user
                              ?.split(" ")
                              .pop()?.[0] ?? "U"}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">
                              {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_USER}
                            </p>
                            <p className="font-black text-foreground tracking-tight">
                              {asset.recentHistory?.[0]?.user ?? "—"}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowReturn(true)}
                          variant="outline"
                          className="w-full h-14 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all gap-3"
                        >
                          <UserX size={16} />{" "}
                          {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_RETURN}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {SYSTEM_MESSAGES.ASSET_DETAIL.SECTION_SUPPORT}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/20 p-5 rounded-3xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_WARRANTY}
                    </p>
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" />{" "}
                      {asset.warranty ?? "—"}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-5 rounded-3xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_SUPPLIER}
                    </p>
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Truck size={14} className="text-primary" />{" "}
                      {asset.supplier ?? "—"}
                    </p>
                  </div>
                  <div className="bg-muted/20 p-5 rounded-3xl border border-border/50">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_CONTRACT}
                    </p>
                    <p className="font-black text-primary text-sm flex items-center gap-2 font-mono">
                      <FileText size={14} /> {asset.contract ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {asset.description && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_DESC_DETAIL}
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border-2 border-dashed border-border/50 italic text-sm text-muted-foreground leading-relaxed">
                    {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                    {asset.description}
                    {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                  </div>
                </div>
              )}
            </div>

            {/* ASSIGN / RETURN POPUPS (Optional inside sheet or using Dialogs) */}
            {/* Keeping simpler internal layouts for better Dark Mode experience */}
            {showAssign && (
              <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tighter">
                    {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_ASSIGN}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAssign(false)}
                    className="rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_USER}
                    </label>
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        placeholder={
                          SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_EMP
                        }
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="h-14 pl-12 rounded-2xl bg-muted/50 border-2 border-border focus-visible:ring-primary focus-visible:border-primary font-bold"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {empLoading ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Loader2 className="animate-spin mx-auto w-8 h-8 mb-2" />{" "}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {SYSTEM_MESSAGES.ASSET_DETAIL.MSG_SEARCHING}
                        </span>
                      </div>
                    ) : employees.length > 0 ? (
                      employees.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => setSelectedEmp(e)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all",
                            selectedEmp?.id === e.id
                              ? "bg-primary border-primary text-white"
                              : "bg-muted/30 border-transparent hover:border-border",
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm",
                              selectedEmp?.id === e.id
                                ? "bg-white text-primary shadow-lg"
                                : "bg-primary/20 text-primary",
                            )}
                          >
                            {e.firstName[0]}
                          </div>
                          <div>
                            <p className="font-black tracking-tight">
                              {e.firstName} {e.lastName}
                            </p>
                            <p
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                selectedEmp?.id === e.id
                                  ? "text-white/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {e.department ?? ""} · {e.position ?? ""}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-muted-foreground italic text-sm">
                        {SYSTEM_MESSAGES.ASSET_DETAIL.MSG_NO_EMPLOYEES}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_ASSIGN_NOTE}
                    </label>
                    <Textarea
                      placeholder={
                        SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_NOTE
                      }
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      className="h-24 rounded-2xl border-2 font-medium bg-muted/50"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4 mt-auto">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAssign(false)}
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {SYSTEM_MESSAGES.BTN_CANCEL}
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={!selectedEmp || assigning}
                    className="flex-1 h-14 bg-emerald-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] gap-3"
                  >
                    {assigning && (
                      <Loader2 size={16} className="animate-spin" />
                    )}{" "}
                    {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_CONFIRM_ASSIGN}
                  </Button>
                </div>
              </div>
            )}

            {showReturn && (
              <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm p-8 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tighter text-rose-500">
                    {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_RETURN}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowReturn(false)}
                    className="rounded-full"
                  >
                    <X size={20} />
                  </Button>
                </div>

                <div className="space-y-8 flex-1">
                  <div className="p-8 bg-rose-500/5 border-2 border-rose-500/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center">
                    <UserX className="w-12 h-12 text-rose-500" />
                    <div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                        {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_RETURN_FROM}
                      </p>
                      <p className="text-xl font-black text-foreground tracking-tighter">
                        {asset.recentHistory?.[0]?.user ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {SYSTEM_MESSAGES.ASSET_DETAIL.TXT_CONDITION_RETURN}
                      </label>
                      <select
                        value={returnCond}
                        onChange={(e) =>
                          setReturnCond(e.target.value as AssetCondition)
                        }
                        className="w-full h-14 bg-muted/50 border-2 border-border rounded-2xl px-4 font-bold text-sm outline-none focus:border-primary transition-all"
                      >
                        {(
                          Object.keys(
                            ASSET_CONDITION_LABELS,
                          ) as AssetCondition[]
                        ).map((c) => (
                          <option key={c} value={c}>
                            {ASSET_CONDITION_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end pb-2">
                      <label className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={readyReuse}
                          onChange={(e) => setReadyReuse(e.target.checked)}
                          className="w-5 h-5 accent-primary rounded-8xl"
                        />
                        {SYSTEM_MESSAGES.ASSET_DETAIL.TXT_READY_REUSE}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {SYSTEM_MESSAGES.ASSET_DETAIL.LABEL_RETURN_NOTE}
                    </label>
                    <Textarea
                      placeholder={
                        SYSTEM_MESSAGES.ASSET_DETAIL.PLACEHOLDER_NOTE
                      }
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      className="h-32 rounded-2xl border-2 font-medium bg-muted/50"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4 mt-auto">
                  <Button
                    variant="ghost"
                    onClick={() => setShowReturn(false)}
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {SYSTEM_MESSAGES.BTN_CANCEL}
                  </Button>
                  <Button
                    onClick={handleReturn}
                    disabled={returning}
                    className="flex-1 h-14 bg-rose-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] gap-3"
                  >
                    {returning && (
                      <Loader2 size={16} className="animate-spin" />
                    )}{" "}
                    {SYSTEM_MESSAGES.ASSET_DETAIL.BTN_CONFIRM_RETURN}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
