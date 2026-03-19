import { useState } from "react"
import { format } from "date-fns"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { leaveService } from "@/services/leaveService"
import type { LeaveRequest } from "../ApproveLeaveRequest"
import { SYSTEM_MESSAGES } from "@/constants/messages"
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations"

/* ================= TYPES ================= */

type Props = {
  request: LeaveRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus?: (id: number, status: string) => void
}

export default function ApproveLeaveDialog({
  request,
  open,
  onOpenChange,
  onUpdateStatus,
}: Props) {
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  if (!request) {
    return null
  }

  const fmt = (d: string) => format(new Date(d + "T00:00:00"), "dd/MM/yyyy")

  const doAction = async (action: "APPROVE" | "REJECT" | "SEND_BACK") => {
    if ((action === "REJECT" || action === "SEND_BACK") && !comment.trim()) {
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT)
      return
    }
    setLoading(true)
    try {
      const updated = await leaveService.processAction(request.id, { action, comments: comment || undefined })
      onUpdateStatus?.(request.id, updated.status)

      let msg = ""
      if (action === "APPROVE") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_APPROVED
      }
      if (action === "REJECT") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_REJECTED
      }
      if (action === "SEND_BACK") {
        msg = SYSTEM_MESSAGES.APPROVE.TOAST_RETURNED
      }

      toast.success(msg)
      onOpenChange(false)
      setComment("")
    } catch {
      toast.error(SYSTEM_MESSAGES.API_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => doAction("APPROVE")
  const handleReject = () => doAction("REJECT")
  const handleSendBack = () => doAction("SEND_BACK")

  const getStatusLabel = () => {
    if (request.status === "APPROVED") {
      return SYSTEM_MESSAGES.STATUS.APPROVED
    }
    if (request.status === "REJECTED") {
      return SYSTEM_MESSAGES.STATUS.REJECTED
    }
    if (request.status === "RETURNED_TO_EMPLOYEE") {
      return SYSTEM_MESSAGES.STATUS.RETURNED
    }
    if (request.status.startsWith("PENDING")) {
      return SYSTEM_MESSAGES.STATUS.PENDING
    }
    return request.status
  }

  const getStatusColor = () => {
    if (request.status === "APPROVED") {
      return "badge-success"
    }
    if (request.status === "REJECTED") {
      return "badge-error"
    }
    if (request.status === "RETURNED_TO_EMPLOYEE") {
      return "badge-warning"
    }
    return "badge-gray"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-white rounded-l-2xl flex flex-col"
      >
        {/* ================= HEADER ================= */}
        <div className="px-6 py-5 border-b bg-muted/10 space-y-3">
          <div>
            <h2 className="text-xl font-bold">
              {SYSTEM_MESSAGES.LEAVE.SHEET_TITLE}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {SYSTEM_MESSAGES.ADJUSTMENT.SHEET_CREATED_AT} {SYSTEM_MESSAGES.APPROVE.PLACEHOLDER_TIME}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono bg-white px-2 py-1 rounded-md shadow border">
              {request.id}
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1">

          {/* ===== THÔNG TIN CHUNG ===== */}
          <section className="space-y-4">
            <h4 className="section-title-muted">
              {SYSTEM_MESSAGES.APPROVE.SECTION_GENERAL}
            </h4>

            <div className="bg-muted/20 p-4 rounded-xl border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {SYSTEM_MESSAGES.LABEL_EMPLOYEE}
                  </p>
                  <p className="font-semibold text-sm">
                    {request.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {SYSTEM_MESSAGES.APPROVE.LABEL_EMP_CODE_SHORT}
                  </p>
                  <p className="font-semibold text-sm">
                    {SYSTEM_MESSAGES.APPROVE.PLACEHOLDER_ID}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  {SYSTEM_MESSAGES.LABEL_DEPARTMENT}
                </p>
                <p className="font-semibold text-sm">
                  {request.dept}
                </p>
              </div>
            </div>
          </section>

          {/* ===== CHI TIẾT NGHỈ PHÉP ===== */}
          <section className="space-y-4">
            <h4 className="section-title-muted">
              {SYSTEM_MESSAGES.APPROVE.SECTION_LEAVE_DETAIL}
            </h4>

            <div className="rounded-xl border shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x border-b bg-muted/20">
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{SYSTEM_MESSAGES.LEAVE.CREATE_DATE_START}</p>
                  <p className="font-semibold text-sm">{fmt(request.startDate)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{SYSTEM_MESSAGES.LEAVE.SHEET_END_DATE}</p>
                  <p className="font-semibold text-sm">{fmt(request.endDate)}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{SYSTEM_MESSAGES.LEAVE.SHEET_TOTAL_TIME}</p>
                <p className="font-bold text-red-500">
                  {request.duration != null ? `${request.duration} ${SYSTEM_MESSAGES.COMMON.DAYS_UNIT}` : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                </p>
              </div>
            </div>
          </section>

          {/* ===== LÝ DO CHI TIẾT ===== */}
          <section className="space-y-3">
            <h4 className="section-title-muted">
              {SYSTEM_MESSAGES.APPROVE.SECTION_REASON_DETAIL}
            </h4>

            <div className="p-4 bg-muted/30 border rounded-xl shadow-sm">
              <p className="text-sm leading-relaxed">
                {request.reason}
              </p>
            </div>
          </section>

          {/* ===== COMMENT (GIỮ NGUYÊN) ===== */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              {SYSTEM_MESSAGES.APPROVE.LABEL_FEEDBACK}
            </label>

            <Textarea
              placeholder={SYSTEM_MESSAGES.APPROVE.FEEDBACK_PLACEHOLDER}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[110px] rounded-xl"
            />
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-4 border-t bg-muted/20 flex gap-2">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={handleReject}
            className="btn-reject"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
            {SYSTEM_MESSAGES.APPROVE.STATUS_REJECTED}
          </Button>
 
          <Button
            variant="outline"
            disabled={loading}
            onClick={handleSendBack}
            className="btn-request-more"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
            {SYSTEM_MESSAGES.STATUS.RETURNED}
          </Button>
 
          <Button
            disabled={loading}
            onClick={handleApprove}
            className="btn-approve"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            {SYSTEM_MESSAGES.APPROVE.BTN_APPROVE}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}