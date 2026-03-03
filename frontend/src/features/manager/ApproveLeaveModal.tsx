import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  request: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (id: string, status: string) => void; // callback cập nhật table
};

export default function ApproveLeaveDialog({
  request,
  open,
  onOpenChange,
  onUpdateStatus,
}: Props) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setLoading(true);

    // giả lập call API
    setTimeout(() => {
      setLoading(false);

      onUpdateStatus?.(request.id, "APPROVED");

      toast.success("Đã phê duyệt đơn nghỉ phép");

      onOpenChange(false);
      setComment("");
    }, 1000);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      onUpdateStatus?.(request.id, "REJECTED");

      toast.success("Đã từ chối đơn nghỉ phép");

      onOpenChange(false);
      setComment("");
    }, 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-white rounded-l-2xl flex flex-col"
      >
        {/* Handle */}
        <div className="flex h-2 items-center justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b flex items-center">
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>

          <h2 className="flex-1 text-center text-base font-semibold">
            Chi tiết đơn nghỉ phép
          </h2>

          <div className="w-5" />
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Applicant */}
          <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {request.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="font-semibold text-sm">
                {request.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.dept}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mã đơn</span>
            <span className="font-medium">{request.id}</span>
          </div>

          <div className="flex items-center justify-between text-sm border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Ngày bắt đầu
              </p>
              <p className="font-medium">
                {request.time.split(" - ")[0]}
              </p>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Ngày kết thúc
              </p>
              <p className="font-medium">
                {request.time.split(" - ")[1]}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Lí do xin nghỉ
            </h3>

            <div className="bg-muted/40 p-4 rounded-xl">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {request.reason}
              </p>
            </div>
          </div>

          {/* Comment */}
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

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex gap-3">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={handleReject}
            className="flex-1 rounded-xl text-red-500 bg-muted hover:bg-muted/70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <XCircle size={18} />
            )}
            Từ chối
          </Button>

          <Button
            disabled={loading}
            onClick={handleApprove}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            Phê duyệt
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}