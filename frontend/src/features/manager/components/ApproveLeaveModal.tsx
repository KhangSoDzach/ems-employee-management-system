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

  if (!request) return null

  const fmt = (d: string) => format(new Date(d + "T00:00:00"), "dd/MM/yyyy")

  const doAction = async (action: "APPROVE" | "REJECT" | "SEND_BACK") => {
    if ((action === "REJECT" || action === "SEND_BACK") && !comment.trim()) {
      toast.error("Vui lòng nhập lý do")
      return
    }
    setLoading(true)
    try {
      const updated = await leaveService.processAction(request.id, { action, comments: comment || undefined })
      onUpdateStatus?.(request.id, updated.status)
      const msg = action === "APPROVE" ? "Đã phê duyệt đơn nghỉ phép" : action === "REJECT" ? "Đã từ chối đơn nghỉ phép" : "Đã trả đơn về cho nhân viên"
      toast.success(msg)
      onOpenChange(false)
      setComment("")
    } catch {
      toast.error("Thao tác thất bại. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => doAction("APPROVE")
  const handleReject  = () => doAction("REJECT")
  const handleSendBack = () => doAction("SEND_BACK")

  const getStatusLabel = () => {
    if (request.status === "APPROVED") return "Đã duyệt"
    if (request.status === "REJECTED") return "Từ chối"
    if (request.status === "RETURNED_TO_EMPLOYEE") return "Trả về"
    if (request.status.startsWith("PENDING")) return "Chờ duyệt"
    return request.status
  }

  const getStatusColor = () => {
    if (request.status === "APPROVED") return "bg-green-100 text-green-600"
    if (request.status === "REJECTED") return "bg-red-100 text-red-600"
    if (request.status === "RETURNED_TO_EMPLOYEE") return "bg-orange-100 text-orange-600"
    return "bg-yellow-100 text-yellow-600"
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
              Chi tiết đơn nghỉ
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo lúc 08:30, 01/03/2026
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              THÔNG TIN CHUNG
            </h4>

            <div className="bg-muted/20 p-4 rounded-xl border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Nhân viên
                  </p>
                  <p className="font-semibold text-sm">
                    {request.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Mã NV
                  </p>
                  <p className="font-semibold text-sm">
                    EMP-001
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  Phòng ban
                </p>
                <p className="font-semibold text-sm">
                  {request.dept}
                </p>
              </div>
            </div>
          </section>

          {/* ===== CHI TIẾT NGHỈ PHÉP ===== */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              CHI TIẾT NGHỈ PHÉP
            </h4>

            <div className="rounded-xl border shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x border-b bg-muted/20">
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ngày bắt đầu</p>
                  <p className="font-semibold text-sm">{fmt(request.startDate)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ngày kết thúc</p>
                  <p className="font-semibold text-sm">{fmt(request.endDate)}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Tổng thời gian</p>
                <p className="font-bold text-red-500">
                  {request.duration != null ? `${request.duration} ngày` : "—"}
                </p>
              </div>
            </div>
          </section>

          {/* ===== LÝ DO CHI TIẾT ===== */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              LÝ DO CHI TIẾT
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
              Ý kiến phản hồi
            </label>

            <Textarea
              placeholder="Nhập nội dung phản hồi cho nhân viên..."
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
            className="flex-1 rounded-xl text-red-500 bg-muted hover:bg-muted/70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
            Từ chối
          </Button>

          <Button
            variant="outline"
            disabled={loading}
            onClick={handleSendBack}
            className="flex-1 rounded-xl text-orange-500 border-orange-200 hover:bg-orange-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
            Trả về
          </Button>

          <Button
            disabled={loading}
            onClick={handleApprove}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Phê duyệt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}