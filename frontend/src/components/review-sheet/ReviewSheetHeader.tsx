import { SYSTEM_MESSAGES } from "@/constants/messages";

interface ReviewSheetHeaderProps {
  title: string;
  subtitle?: string;
  id: string | number;
  statusLabel: string;
  statusColor: string;
}

export function ReviewSheetHeader({
  title,
  subtitle,
  id,
  statusLabel,
  statusColor,
}: ReviewSheetHeaderProps) {
  return (
    <div className="px-6 py-5 border-b bg-muted/10 space-y-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {SYSTEM_MESSAGES.ADJUSTMENT.SHEET_CREATED_AT} {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono bg-background px-2 py-1 rounded-md shadow-sm border border-border">
          {id}
        </span>
        <span
          className={`text-[10px] tracking-wider font-bold px-3 py-1 rounded-full ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
