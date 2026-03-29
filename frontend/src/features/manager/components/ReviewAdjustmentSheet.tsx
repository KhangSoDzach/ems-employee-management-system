import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowRight, X } from "lucide-react";
import { format } from "date-fns";
import {
  type AdjustmentRequest,
  DATETIME_FORMAT,
  DATE_FORMAT,
  ADJUSTMENT_STATUS_CONFIG,
} from "@/constants/adjustment-request";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { toast } from "sonner";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import {
  ReviewSheetHeader,
  ReviewSheetProfile,
  ReviewSheetFeedback,
  ReviewSheetFooter,
} from "@/components/review-sheet";

interface ReviewAdjustmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdjustmentRequest | null;
  onApprove?: (id: string, reason: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onReturn?: (id: string, reason: string) => Promise<void>;
}

export function ReviewAdjustmentSheet({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject,
  onReturn,
}: ReviewAdjustmentSheetProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState<
    "approve" | "reject" | "return" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject" | "return") => {
    if (!request) {
      return;
    }
    if (action === "reject" || action === "return") {
      if (!note.trim()) {
        setError(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
        toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
        return;
      }
      if (note.trim().length < 5) {
        setError(FORM_VALIDATION_MESSAGES.MIN_LENGTH(5));
        toast.error(FORM_VALIDATION_MESSAGES.MIN_LENGTH(5));
        return;
      }
    }
    setError(null);

    const handler =
      action === "approve"
        ? onApprove
        : action === "reject"
          ? onReject
          : onReturn;
    if (!handler) {
      return;
    }
    setSubmitting(action);
    try {
      await handler(request.id, note);
      setNote("");
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusColor = () => {
    if (!request) {
      return "badge-gray";
    }
    switch (request.status) {
      case "APPROVED":
        return "badge-success";
      case "REJECTED":
        return "badge-error";
      case "RETURNED":
        return "badge-warning";
      default:
        return "badge-warning";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 bg-slate-50 rounded-l-2xl flex flex-col border-l shadow-2xl overflow-hidden"
      >
        {request && (
          <ReviewSheetHeader
            title={SYSTEM_MESSAGES.APPROVE.ADJUSTMENT_TITLE}
            subtitle={format(request.dateCreated, DATETIME_FORMAT)}
            id={request.id}
            statusLabel={ADJUSTMENT_STATUS_CONFIG[request.status].label}
            statusColor={getStatusColor()}
          />
        )}

        {request ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex flex-col gap-8 text-sm">
              <ReviewSheetProfile
                name={
                  request.auditTrail[0]?.actor || SYSTEM_MESSAGES.STATUS.UNKNOWN
                }
                id={request.id}
                isUrgent={request.status === "PENDING"}
              />

              {/* Adjustment Detail */}
              <section className="space-y-4">
                <h4 className="section-title-muted uppercase tracking-wider">
                  {SYSTEM_MESSAGES.APPROVE.SECTION_LEAVE_DETAIL}
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-blue-400 transition-colors"></div>
                    <div className="flex flex-col z-10">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">
                        {SYSTEM_MESSAGES.REVIEW.ORIGINAL}
                      </span>
                      <span className="font-black text-xl text-slate-700 tracking-tight">
                        {request.originalTimeIn && request.originalTimeOut
                          ? `${request.originalTimeIn} - ${request.originalTimeOut}`
                          : request.originalTimeIn ||
                            request.originalTimeOut ||
                            SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-full border border-slate-100 mx-2">
                      <ArrowRight className="text-slate-300 h-5 w-5" />
                    </div>
                    <div className="flex flex-col text-right z-10">
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1.5">
                        {SYSTEM_MESSAGES.REVIEW.PROPOSED}
                      </span>
                      <span className="font-black text-xl text-slate-900 tracking-tight">
                        {request.proposedTimeIn && request.proposedTimeOut
                          ? `${request.proposedTimeIn} - ${request.proposedTimeOut}`
                          : request.proposedTimeIn ||
                            request.proposedTimeOut ||
                            SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                      {SYSTEM_MESSAGES.LABEL_DATE}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      {format(request.adjustmentDate, DATE_FORMAT)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Reason */}
              <section className="space-y-4">
                <h4 className="section-title-muted uppercase tracking-wider">
                  {SYSTEM_MESSAGES.APPROVE.SECTION_REASON_DETAIL}
                </h4>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm italic text-slate-600 font-medium leading-relaxed decoration-slate-100">
                  <p>
                    {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                    {request.reason}
                    {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                  </p>
                </div>
              </section>

              <ReviewSheetFeedback
                value={note}
                onChange={(v) => {
                  setNote(v);
                  if (error) {
                    setError(null);
                  }
                }}
                error={error ?? undefined}
              />

              {/* Activity History */}
              {/* <section className="space-y-6 pt-2 pb-8">
                                <h4 className="section-title-muted uppercase tracking-wider">
                                    {SYSTEM_MESSAGES.REVIEW.ACTIVITY_HISTORY}
                                </h4>
                                <div className="space-y-8 pt-2 pl-4 border-l-2 ml-3 border-slate-200 relative">

                                    {request.auditTrail.slice().reverse().map((audit) => {
                                        const Config = AUDIT_ACTION_CONFIG[audit.action];
                                        const Icon = Config.icon;
                                        
                                        let ringColor = 'border-slate-300 text-slate-500 bg-slate-50';
                                        if (audit.action === 'APPROVED') {ringColor = 'border-emerald-500 text-emerald-600 bg-emerald-50';}
                                        else if (audit.action === 'CREATED') {ringColor = 'border-blue-500 text-blue-600 bg-blue-50';}
                                        else if (audit.action === 'REJECTED') {ringColor = 'border-rose-500 text-rose-600 bg-rose-50';}
                                        else if (audit.action === 'RETURNED') {ringColor = 'border-orange-500 text-orange-600 bg-orange-50';}

                                        return (
                                            <div key={audit.id} className="relative pl-7 transition-all hover:translate-x-1 duration-200 text-sm">
                                                <div className={`absolute -left-[1.85rem] top-0 h-7 w-7 rounded-full border-2 flex items-center justify-center z-10 shadow-sm ${ringColor}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-800">{Config.label}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {format(audit.timestamp, DATETIME_LOG_FORMAT)}
                                                        </span>
                                                    </div>
                                                    <span className="text-slate-500 text-xs font-semibold">{audit.actor}</span>
                                                    {audit.note && (
                                                        <div className="mt-2 p-3 rounded-lg bg-slate-100/70 border border-slate-200/50 text-xs italic text-slate-600 relative">
                                                            <div className="absolute top-0 left-4 w-2 h-2 bg-slate-100/70 border-t border-l border-slate-200/50 -translate-y-1/2 rotate-45"></div>
                                                            {SYSTEM_MESSAGES.SYMBOLS.QUOTE}{audit.note}{SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section> */}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-12 text-center space-y-4 flex-col">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="text-slate-300 h-8 w-8" />
            </div>
            <p className="text-sm font-medium">{SYSTEM_MESSAGES.NO_DATA}</p>
          </div>
        )}

        {request && (
          <ReviewSheetFooter
            onApprove={() => handleAction("approve")}
            onReject={() => handleAction("reject")}
            onReturn={() => handleAction("return")}
            isPending={
              request.status === "PENDING" || request.status === "RETURNED"
            }
            processing={submitting}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
