import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ADJUSTMENT_TYPE_CONFIG,
  AUDIT_ACTION_CONFIG,
  CURRENT_USER,
  DATE_FORMAT,
  DATETIME_FORMAT,
  DATETIME_LOG_FORMAT,
  type AdjustmentRequest,
  type AuditEntry,
} from "../adjustment-request.constants";
import { StatusBadge } from "./AdjustmentBadges";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/* ══════════════ SHEET LABELS ══════════════ */

export const SHEET_LABELS = {
  timeSection: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_TIME_SECTION,
  oldCheckin: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_OLD_CHECKIN,
  oldCheckout: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_OLD_CHECKOUT,
  proposed: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_PROPOSED,
  reason: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_REASON,
  history: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_HISTORY,
  createdAt: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_CREATED_AT,
  empty: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_EMPTY,
} as const;

/* ══════════════ AUDIT TIMELINE ══════════════ */

const AuditTimeline = ({ entries }: { entries: AuditEntry[] }) => (
  <div className="relative pl-6">
    <div className="absolute left-3 top-0 bottom-0 w-px bg-muted" />
    <div className="space-y-5">
      {entries.map((entry, i) => {
        const cfg = AUDIT_ACTION_CONFIG[entry.action];
        const IconComp = cfg.icon;
        return (
          <div key={entry.id} className="relative flex gap-3">
            <div
              className={cn(
                "absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border-2 border-background shadow-sm",
                cfg.iconClass,
              )}
            >
              <IconComp className="w-3 h-3" />
            </div>

            <div className="ml-4 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {cfg.label}
                </p>
                <time className="text-xs text-muted-foreground shrink-0">
                  {i === 0
                    ? formatDistanceToNow(entry.timestamp, {
                        addSuffix: true,
                        locale: vi,
                      })
                    : format(entry.timestamp, DATETIME_LOG_FORMAT)}
                </time>
              </div>
              <p className="text-xs text-muted-foreground">{entry.actor}</p>
              {entry.note && (
                <blockquote className="mt-2 pl-3 border-l-2 border-muted-foreground/20 text-xs text-muted-foreground italic bg-muted/40 py-2 pr-2 rounded-r-md">
                  "{entry.note}"
                </blockquote>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ══════════════ DETAIL SHEET ══════════════ */

interface DetailSheetProps {
  request: AdjustmentRequest | null;
  open: boolean;
  onClose: () => void;
}

export const DetailSheet = ({ request, open, onClose }: DetailSheetProps) => {
  if (!request) {
    return null;
  }

  const hasIn = request.type === "CHECK_IN" || request.type === "BOTH";
  const hasOut = request.type === "CHECK_OUT" || request.type === "BOTH";

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        {/* ── Header ── */}
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{CURRENT_USER.initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base font-bold leading-tight">
                {CURRENT_USER.name}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0">
                {ADJUSTMENT_TYPE_CONFIG[request.type].label}
                {SYSTEM_MESSAGES.SYMBOLS.BULLET}
                {request.id}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="text-xs text-muted-foreground">
              {SHEET_LABELS.createdAt}{" "}
              {format(request.dateCreated, DATETIME_FORMAT)}
            </span>
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* So sánh thời gian */}
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {SHEET_LABELS.timeSection}
              {SYSTEM_MESSAGES.SYMBOLS.EM_DASH}
              {format(request.adjustmentDate, DATE_FORMAT)}
            </h4>
            <div className="space-y-3">
              {hasIn && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {SHEET_LABELS.oldCheckin}
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {request.originalTimeIn ?? SHEET_LABELS.empty}
                    </p>
                  </div>
                  <div className="text-muted-foreground/40 text-lg font-light">
                    {SYSTEM_MESSAGES.SYMBOLS.ARROW_RIGHT}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {SHEET_LABELS.proposed}
                    </p>
                    <p className="text-sm font-bold text-green-700">
                      {request.proposedTimeIn}
                    </p>
                  </div>
                </div>
              )}
              {hasOut && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {SHEET_LABELS.oldCheckout}
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {request.originalTimeOut ?? SHEET_LABELS.empty}
                    </p>
                  </div>
                  <div className="text-muted-foreground/40 text-lg font-light">
                    {SYSTEM_MESSAGES.SYMBOLS.ARROW_RIGHT}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {SHEET_LABELS.proposed}
                    </p>
                    <p className="text-sm font-bold text-green-700">
                      {request.proposedTimeOut}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Lý do */}
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {SHEET_LABELS.reason}
            </h4>
            <blockquote className="pl-4 border-l-4 border-primary/30 bg-primary/5 py-3 pr-3 rounded-r-xl text-sm text-muted-foreground italic">
              {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
              {request.reason}
              {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
            </blockquote>
          </section>

          {/* Lịch sử thao tác */}
          <section>
            <h4 className="section-title-muted mb-4">{SHEET_LABELS.history}</h4>
            <AuditTimeline entries={request.auditTrail} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};
