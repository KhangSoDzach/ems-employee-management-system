import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ADJUSTMENT_TYPE_CONFIG,
  CURRENT_USER,
  DATE_FORMAT,
  DATETIME_FORMAT,
  type AdjustmentRequest,
} from "@/constants/adjustment-request";
import { StatusBadge } from "./AdjustmentBadges";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/* ══════════════ SHEET LABELS ══════════════ */

export const SHEET_LABELS = {
  timeSection: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_TIME_SECTION,
  proposed: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_PROPOSED,
  reason: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_REASON,
  createdAt: SYSTEM_MESSAGES.ADJUSTMENT.SHEET_CREATED_AT,
  checkIn: SYSTEM_MESSAGES.CHECKIN.TABLE_CHECKIN,
  checkOut: SYSTEM_MESSAGES.CHECKIN.TABLE_CHECKOUT,
} as const;

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
              {SHEET_LABELS.createdAt}
              {SYSTEM_MESSAGES.SYMBOLS.SPACE}
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
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs text-muted-foreground">
                      {SHEET_LABELS.checkIn}
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {SHEET_LABELS.proposed}
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        {request.proposedTimeIn}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {hasOut && (
                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs text-muted-foreground">
                      {SHEET_LABELS.checkOut}
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {SHEET_LABELS.proposed}
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        {request.proposedTimeOut}
                      </p>
                    </div>
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
