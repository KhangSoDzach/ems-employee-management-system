import { useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";

import { leaveService } from "@/services/leaveService";
import type { LeaveRequest } from "../ApproveLeaveRequest";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import {
  DATETIME_FORMAT,
  DATE_FORMAT,
  BACKEND_LEAVE_STATUS,
  LEAVE_PROCESS_ACTION,
} from "@/constants/leave-request";
import {
  ReviewSheetHeader,
  ReviewSheetProfile,
  ReviewSheetFeedback,
  ReviewSheetFooter,
} from "@/components/review-sheet";
import { useAuth } from "@/contexts/AuthContext";

/* ================= TYPES ================= */

type Props = {
  request: LeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (id: number, status: string) => void;
};

export default function ApproveLeaveDialog({
  request,
  open,
  onOpenChange,
  onUpdateStatus,
}: Props) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!request) {
    return null;
  }

  const doAction = async (action: keyof typeof LEAVE_PROCESS_ACTION) => {
    const isDestructive =
      action === LEAVE_PROCESS_ACTION.REJECT ||
      action === LEAVE_PROCESS_ACTION.SEND_BACK;

    if (isDestructive) {
      if (!comment.trim()) {
        setError(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
        toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
        return;
      }
      if (comment.trim().length < 5) {
        setError(FORM_VALIDATION_MESSAGES.MIN_LENGTH(5));
        toast.error(FORM_VALIDATION_MESSAGES.MIN_LENGTH(5));
        return;
      }
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await leaveService.processAction(request.id, {
        action,
        comments: comment || undefined,
      });
      onUpdateStatus?.(request.id, updated.status);

      let msg = "";
      if (action === LEAVE_PROCESS_ACTION.APPROVE) {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_APPROVED;
      } else if (action === LEAVE_PROCESS_ACTION.REJECT) {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_REJECTED;
      } else if (action === LEAVE_PROCESS_ACTION.SEND_BACK) {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_RETURNED;
      }

      toast.success(msg);
      onOpenChange(false);
      setComment("");
    } catch {
      toast.error(SYSTEM_MESSAGES.API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => doAction(LEAVE_PROCESS_ACTION.APPROVE);
  const handleReject = () => doAction(LEAVE_PROCESS_ACTION.REJECT);
  const handleSendBack = () => doAction(LEAVE_PROCESS_ACTION.SEND_BACK);

  const getStatusLabel = () => {
    if (request.status === BACKEND_LEAVE_STATUS.APPROVED) {
      return SYSTEM_MESSAGES.STATUS.APPROVED;
    }
    if (request.status === BACKEND_LEAVE_STATUS.REJECTED) {
      return SYSTEM_MESSAGES.STATUS.REJECTED;
    }
    if (request.status === BACKEND_LEAVE_STATUS.RETURNED) {
      return SYSTEM_MESSAGES.STATUS.RETURNED;
    }
    if (request.status.startsWith(BACKEND_LEAVE_STATUS.PENDING)) {
      return SYSTEM_MESSAGES.STATUS.PENDING;
    }
    return request.status;
  };

  const getStatusColor = () => {
    if (request.status === BACKEND_LEAVE_STATUS.APPROVED) {
      return "badge-success";
    }
    if (request.status === BACKEND_LEAVE_STATUS.REJECTED) {
      return "badge-error";
    }
    if (request.status === BACKEND_LEAVE_STATUS.RETURNED) {
      return "badge-warning";
    }
    return "badge-warning";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 bg-background rounded-l-2xl flex flex-col border-l shadow-2xl overflow-hidden"
      >
        <ReviewSheetHeader
          title={SYSTEM_MESSAGES.LEAVE.SHEET_TITLE}
          subtitle={format(new Date(request.createdAt), DATETIME_FORMAT)}
          id={request.id}
          statusLabel={getStatusLabel()}
          statusColor={getStatusColor()}
        />

        {/* ================= BODY ================= */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          <ReviewSheetProfile
            name={request.name}
            dept={request.dept}
            id={request.id}
            isUrgent={request.status.startsWith(BACKEND_LEAVE_STATUS.PENDING)}
          />

          {/* ===== CHI TIẾT NGHỈ PHÉP ===== */}
          <section className="space-y-4">
            <h4 className="section-title-muted uppercase tracking-wider">
              {SYSTEM_MESSAGES.APPROVE.SECTION_LEAVE_DETAIL}
            </h4>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-sm">
              <div className="grid grid-cols-2 divide-x divide-border border-b">
                <div className="p-4 bg-muted/30">
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.LEAVE.CREATE_DATE_START}
                  </p>
                  <p className="font-bold text-foreground">
                    {format(
                      new Date(request.startDate + "T00:00:00"),
                      DATE_FORMAT,
                    )}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.LEAVE.SHEET_END_DATE}
                  </p>
                  <p className="font-bold text-foreground">
                    {format(
                      new Date(request.endDate + "T00:00:00"),
                      DATE_FORMAT,
                    )}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                  {SYSTEM_MESSAGES.LEAVE.SHEET_TOTAL_TIME}
                </p>
                <p className="font-bold text-destructive">
                  {request.duration !== null
                    ? `${request.duration} ${SYSTEM_MESSAGES.COMMON.DAYS_UNIT}`
                    : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                </p>
              </div>
            </div>
          </section>

          {/* ===== LÝ DO CHI TIẾT ===== */}
          <section className="space-y-3">
            <h4 className="section-title-muted uppercase tracking-wider">
              {SYSTEM_MESSAGES.APPROVE.SECTION_REASON_DETAIL}
            </h4>

            <div className="p-4 bg-card border border-border rounded-xl shadow-sm italic text-muted-foreground font-medium text-sm">
              <p className="leading-relaxed">
                {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                {request.reason}
                {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
              </p>
            </div>
          </section>

          <ReviewSheetFeedback
            value={comment}
            onChange={(v) => {
              setComment(v);
              if (error) {
                setError(null);
              }
            }}
            error={error ?? undefined}
          />
        </div>

        <ReviewSheetFooter
          onApprove={handleApprove}
          onReject={handleReject}
          onReturn={handleSendBack}
          isPending={request.status.startsWith(BACKEND_LEAVE_STATUS.PENDING)}
          processing={loading}
          actionDisabled={user?.id === request.requesterUserId}
        />
      </SheetContent>
    </Sheet>
  );
}
