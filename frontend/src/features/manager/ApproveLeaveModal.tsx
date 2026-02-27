import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ApproveLeaveDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            Chi tiết đơn nghỉ phép
          </DialogTitle>

          <DialogDescription>
            Xem và phê duyệt yêu cầu nghỉ phép của nhân viên.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 space-y-5">
          {/* Employee Info */}
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
                👤
              </div>
              <div>
                <p className="font-semibold text-base">Nguyễn Văn A</p>
                <p className="text-sm text-muted-foreground">ID: EMP12345</p>
              </div>
            </div>
            <div className="p-4 text-sm text-muted-foreground">
              Phòng ban:{" "}
              <span className="font-medium text-foreground">
                Phát triển phần mềm (IT)
              </span>
            </div>
          </div>

          {/* Leave Info */}
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Thông tin nghỉ phép
              </p>
            </div>

            <div className="p-4 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loại nghỉ</span>
                <span className="font-medium">Nghỉ phép năm</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái</span>
                <span className="px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-700">
                  Chờ duyệt
                </span>
              </div>

              <div className="flex justify-between border-t pt-3">
                <span className="text-muted-foreground">Từ ngày</span>
                <span className="font-medium">10/10/2023</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Đến ngày</span>
                <span className="font-medium">12/10/2023</span>
              </div>

              <div className="pt-3 border-t">
                <p className="text-muted-foreground mb-1">Lý do nghỉ</p>
                <p className="italic text-foreground">
                  Giải quyết việc gia đình đột xuất.
                </p>
              </div>
            </div>
          </div>

          {/* Leave Summary */}
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold uppercase tracking-wider">
                Tóm tắt ngày nghỉ
              </p>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phép hiện có</span>
                <span className="font-medium">12 ngày</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Số ngày yêu cầu</span>
                <span className="font-medium text-primary">- 3 ngày</span>
              </div>

              <div className="flex justify-between pt-3 border-t font-semibold">
                <span>Số dư sau khi duyệt</span>
                <span className="text-green-600">9 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-col sm:flex-row gap-3">
          <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
            Phê duyệt
          </Button>

          <Button variant="destructive" className="w-full sm:w-auto">
            Từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveLeaveDialog;
