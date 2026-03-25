import { SYSTEM_MESSAGES } from "@/constants/messages";

interface ReviewSheetProfileProps {
  name: string;
  dept?: string;
  avatar?: string;
  id?: string | number;
  isUrgent?: boolean;
}

export function ReviewSheetProfile({
  name,
  avatar,
  isUrgent,
}: ReviewSheetProfileProps) {
  return (
    <section className="space-y-4">
      <h4 className="section-title-muted uppercase tracking-wider">
        {SYSTEM_MESSAGES.APPROVE.SECTION_GENERAL}
      </h4>
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all text-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-inner">
            {avatar || name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              {name}
            </h3>
          </div>
        </div>
        {isUrgent && (
          <div className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
            {SYSTEM_MESSAGES.REVIEW.URGENT}
          </div>
        )}
      </div>
    </section>
  );
}
