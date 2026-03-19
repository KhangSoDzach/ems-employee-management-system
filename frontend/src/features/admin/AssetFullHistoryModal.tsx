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

export default function AssetFullHistoryModal({ open, assetId, onClose }: Props) {
  const [history, setHistory] = useState<AssetHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !assetId) {return;}

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

  if (!open) {return null;}

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="px-8 py-5 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{SYSTEM_MESSAGES.ASSET_HISTORY.TITLE}</h2>
              <p className="text-xs text-slate-500">{SYSTEM_MESSAGES.ASSET_HISTORY.DESC}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">{SYSTEM_MESSAGES.ASSET_HISTORY.LOADING}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Info size={40} className="mb-2 opacity-20" />
              <p className="font-medium text-lg text-slate-500">{SYSTEM_MESSAGES.ASSET_HISTORY.EMPTY_TITLE}</p>
              <p className="text-sm">{SYSTEM_MESSAGES.ASSET_HISTORY.EMPTY_DESC}</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

              <div className="space-y-8 relative">
                {history.map((item) => (
                  <div key={item.id} className="flex gap-6">
                    <div className="relative z-10">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border-4 border-white dark:border-slate-900 ${item.action.includes(SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_CREATE) ? "bg-emerald-500 text-white" :
                        item.action.includes(SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_ASSIGN) ? "bg-blue-500 text-white" :
                          item.action.includes(SYSTEM_MESSAGES.ASSET_HISTORY.ACTION_RETURN) ? "bg-amber-500 text-white" :
                            "bg-slate-500 text-white"
                        }`}>
                        <History size={16} />
                      </div>
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.action}</h4>
                          <span className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/5 px-2.5 py-1 rounded-full">
                            <Calendar size={12} />
                            {item.date}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <User size={13} className="opacity-70" />
                            {SYSTEM_MESSAGES.ASSET_HISTORY.DONE_BY} <span className="text-slate-700 dark:text-slate-300 ml-0.5">{item.user}</span>
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
        <div className="px-8 py-4 border-t bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            {SYSTEM_MESSAGES.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}