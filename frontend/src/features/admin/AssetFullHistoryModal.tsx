import { useState, useEffect } from "react";
import { X, History, Loader2, Calendar, User, Info } from "lucide-react";
import { toast } from "sonner";
import { assetService, AssetHistoryItem } from "@/services/assetService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
  open: boolean;
  assetId: string | number | null;
  onClose: () => void;
}

export default function AssetFullHistoryModal({
  open,
  assetId,
  onClose,
}: Props) {
  const [history, setHistory] = useState<AssetHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !assetId) {
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await assetService.getHistory(assetId, { size: 100 });
        setHistory(res.content);
      } catch {
        toast.error(SYSTEM_MESSAGES.ASSET_HISTORY.MSG_FETCH_ERROR);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [open, assetId]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="modal-content max-w-4xl">
        {/* HEADER */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <History size={24} />
            </div>
            <div>
              <h2 className="modal-title">
                {SYSTEM_MESSAGES.ASSET_HISTORY.TITLE}
              </h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                {SYSTEM_MESSAGES.ASSET_HISTORY.DESC}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors group"
          >
            <X
              size={20}
              className="text-muted-foreground group-hover:text-foreground"
            />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">
                {SYSTEM_MESSAGES.ASSET_HISTORY.LOADING}
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <Info size={40} className="mb-2 opacity-20" />
              <p className="font-medium text-lg text-foreground">
                {SYSTEM_MESSAGES.ASSET_HISTORY.EMPTY_TITLE}
              </p>
              <p className="text-sm">
                {SYSTEM_MESSAGES.ASSET_HISTORY.EMPTY_DESC}
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-8 relative">
                {history.map((item) => (
                  <div key={item.id} className="flex gap-6">
                    <div className="relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-4 border-background ${
                          item.action.includes(
                            SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_CREATE,
                          )
                            ? "bg-emerald-500 text-white"
                            : item.action.includes(
                                  SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_ASSIGN,
                                )
                              ? "bg-blue-500 text-white"
                              : item.action.includes(
                                    SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_RETURN,
                                  )
                                ? "bg-amber-500 text-white"
                                : "bg-muted-foreground text-white"
                        }`}
                      >
                        <History size={16} />
                      </div>
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <h4 className="font-black text-foreground uppercase tracking-tight">
                            {item.action}
                          </h4>
                          <span className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                            <Calendar size={12} />
                            {item.date}
                          </span>
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            <User size={13} className="opacity-50" />
                            {SYSTEM_MESSAGES.ASSET_HISTORY.DONE_BY}{" "}
                            <span className="text-foreground ml-1">
                              {item.user}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            {SYSTEM_MESSAGES.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
