/**
 * @file ForbiddenPage.tsx
 * @description Trang hiển thị thông báo lỗi 403 khi người dùng không có quyền truy cập.
 * Page displaying 403 error message when the user lacks access permissions.
 */

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SYSTEM_MESSAGES } from "@/constants/messages";

/**
 * @component ForbiddenPage
 * @description Thành phần hiển thị giao diện báo lỗi truy cập bị từ chối.
 * Component displaying the access denied error interface.
 */
export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-destructive/10 p-6 text-destructive">
          <ShieldAlert className="h-16 w-16" />
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl dark:text-gray-100">
          {SYSTEM_MESSAGES.SECURITY.FORBIDDEN_CODE}
        </h1>
        <p className="mb-8 text-lg font-medium text-muted-foreground">
          {SYSTEM_MESSAGES.SECURITY.FORBIDDEN_DESC}
        </p>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-12 px-8 font-bold"
          >
            {SYSTEM_MESSAGES.BTN_BACK}
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="h-12 px-8 font-bold shadow-lg shadow-primary/20"
          >
            {SYSTEM_MESSAGES.SECURITY.GO_HOME}
          </Button>
        </div>
      </div>
    </div>
  );
}
