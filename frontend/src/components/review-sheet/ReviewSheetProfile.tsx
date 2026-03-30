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
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm transition-all text-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold border border-border shadow-inner">
            {avatar || name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-base text-foreground leading-tight">
              {name}
            </h3>
          </div>
        </div>
        {isUrgent && (
          <div className="text-[10px] font-black uppercase text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20">
            {SYSTEM_MESSAGES.REVIEW.URGENT}
          </div>
        )}
      </div>
    </section>
  );
}
