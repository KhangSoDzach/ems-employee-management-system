import { useState } from "react";
import { format } from "date-fns";
import { Check, Circle, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

type Props = {
  request: LeaveRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (id: number, status: string) => void;
};

/* ================= APPROVAL STEPPER ================= */

type ApprovalStep = {
  label: string;
  status: "completed" | "current" | "pending";
};

function getApprovalSteps(
  currentLevel: number | null | undefined,
  maxLevel: number | null | undefined,
  status: string,
): ApprovalStep[] {
  const isApproved = status === BACKEND_LEAVE_STATUS.APPROVED;
  const isRejected = status === BACKEND_LEAVE_STATUS.REJECTED;
  const isReturned = status === BACKEND_LEAVE_STATUS.RETURNED;
  const isTerminal = isApproved || isRejected || isReturned;

  const steps: ApprovalStep[] = [];

  const totalLevels = maxLevel ?? 1;
  const effectiveCurrent = isTerminal
    ? isApproved
      ? totalLevels
      : (currentLevel ?? 1)
    : (currentLevel ?? 1);

  for (let i = 1; i <= totalLevels; i++) {
    const label =
      i === 1
        ? SYSTEM_MESSAGES.LEAVE.APPROVAL_STEP_MANAGER
        : SYSTEM_MESSAGES.LEAVE.APPROVAL_STEP_HR;
    let stepStatus: ApprovalStep["status"];

    if (isTerminal) {
      stepStatus = isApproved ? "completed" : "pending";
    } else if (i < effectiveCurrent) {
      stepStatus = "completed";
    } else if (i === effectiveCurrent) {
      stepStatus = "current";
    } else {
      stepStatus = "pending";
    }

    steps.push({ label, status: stepStatus });
  }

  return steps;
}

function ApprovalStepper({ steps }: { steps: ApprovalStep[] }) {
  if (steps.length <= 1) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h4 className="section-title-muted uppercase tracking-wider">
        {SYSTEM_MESSAGES.LEAVE.APPROVAL_SECTION_TITLE}
      </h4>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors",
                  step.status === "completed" &&
                    "bg-emerald-500 border-emerald-500 text-white",
                  step.status === "current" &&
                    "bg-primary border-primary text-primary-foreground",
                  step.status === "pending" &&
                    "bg-background border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {step.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : step.status === "current" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold text-center leading-tight",
                  step.status === "completed" && "text-emerald-600",
                  step.status === "current" && "text-primary",
                  step.status === "pending" && "text-muted-foreground/60",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 -mt-6",
                  step.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

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
      const payload = {
        action,
        comments: comment?.trim() || undefined,
      };
      const updated = await leaveService.processAction(request.id, payload);
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : SYSTEM_MESSAGES.API_ERROR;
      toast.error(errorMessage);
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
        <SheetTitle className="sr-only">
          {SYSTEM_MESSAGES.LEAVE.SHEET_TITLE}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {SYSTEM_MESSAGES.LEAVE.SHEET_DESCRIPTION}
        </SheetDescription>
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

          <ApprovalStepper
            steps={getApprovalSteps(
              request.currentApprovalLevel,
              request.maxApprovalLevel,
              request.status,
            )}
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
