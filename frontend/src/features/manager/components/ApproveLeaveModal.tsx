import { useState } from "react";
import { format } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";

import { leaveService } from "@/services/leaveService";
import type { LeaveRequest } from "../ApproveLeaveRequest";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useAuth } from "@/contexts/AuthContext";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import {
  DATETIME_FORMAT,
  DATE_FORMAT,
} from "../../employee/adjustment-request.constants";
import {
  ReviewSheetHeader,
  ReviewSheetProfile,
  ReviewSheetFeedback,
  ReviewSheetFooter,
} from "@/components/review-sheet";

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
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!request) {
    return null;
  }

  const doAction = async (action: "APPROVE" | "REJECT" | "SEND_BACK") => {
    if ((action === "REJECT" || action === "SEND_BACK") && !comment.trim()) {
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
      return;
    }
    setLoading(true);
    try {
      const updated = await leaveService.processAction(request.id, {
        action,
        comments: comment || undefined,
      });
      onUpdateStatus?.(request.id, updated.status);

      let msg = "";
      if (action === "APPROVE") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_APPROVED;
      }
      if (action === "REJECT") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_REJECTED;
      }
      if (action === "SEND_BACK") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_RETURNED;
      }

      toast.success(msg);
      onOpenChange(false);
      setComment("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || SYSTEM_MESSAGES.API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => doAction("APPROVE");
  const handleReject = () => doAction("REJECT");
  const handleSendBack = () => doAction("SEND_BACK");

  const getStatusLabel = () => {
    if (request.status === "APPROVED") {
      return SYSTEM_MESSAGES.STATUS.APPROVED;
    }
    if (request.status === "REJECTED") {
      return SYSTEM_MESSAGES.STATUS.REJECTED;
    }
    if (request.status === "RETURNED_TO_EMPLOYEE") {
      return SYSTEM_MESSAGES.STATUS.RETURNED;
    }
    if (request.status.startsWith("PENDING")) {
      return SYSTEM_MESSAGES.STATUS.PENDING;
    }
    return request.status;
  };

  const getStatusColor = () => {
    if (request.status === "APPROVED") {
      return "badge-success";
    }
    if (request.status === "REJECTED") {
      return "badge-error";
    }
    if (request.status === "RETURNED_TO_EMPLOYEE") {
      return "badge-warning";
    }
    return "badge-gray";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 bg-slate-50 rounded-l-2xl flex flex-col border-l shadow-2xl overflow-hidden"
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
            isUrgent={request.status.startsWith("PENDING")}
          />

          {/* ===== CHI TIẾT NGHỈ PHÉP ===== */}
          <section className="space-y-4">
            <h4 className="section-title-muted uppercase tracking-wider">
              {SYSTEM_MESSAGES.APPROVE.SECTION_LEAVE_DETAIL}
            </h4>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-b">
                <div className="p-4 bg-muted/5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.LEAVE.CREATE_DATE_START}
                  </p>
                  <p className="font-bold text-slate-900">
                    {format(
                      new Date(request.startDate + "T00:00:00"),
                      DATE_FORMAT,
                    )}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1">
                    {SYSTEM_MESSAGES.LEAVE.SHEET_END_DATE}
                  </p>
                  <p className="font-bold text-slate-900">
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
                <p className="font-bold text-red-500">
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

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm italic text-slate-600 font-medium text-sm">
              <p className="leading-relaxed">
                {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
                {request.reason}
                {SYSTEM_MESSAGES.SYMBOLS.QUOTE}
              </p>
            </div>
          </section>

          {user?.id === request.requesterUserId ? (
            <div className="bg-amber-50 text-amber-600 border border-amber-200 p-4 rounded-xl text-sm font-medium text-center">
              Bạn không thể tự phê duyệt đơn của bản thân. Hãy chờ thành viên
              khác trong phòng HR hoặc Trưởng phòng xử lý.
            </div>
          ) : (
            <ReviewSheetFeedback value={comment} onChange={setComment} />
          )}
        </div>

        <ReviewSheetFooter
          onApprove={handleApprove}
          onReject={handleReject}
          onReturn={handleSendBack}
          isPending={request.status.startsWith("PENDING")}
          processing={loading}
          actionDisabled={user?.id === request.requesterUserId}
        />
      </SheetContent>
    </Sheet>
  );
}
