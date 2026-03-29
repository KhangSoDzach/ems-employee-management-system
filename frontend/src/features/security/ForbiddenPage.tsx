import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 rounded-full bg-destructive/10 p-6 text-destructive">
          <ShieldAlert className="h-16 w-16" />
        </div>
        <h1 className="mb-2 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl dark:text-gray-100">
          403
        </h1>
        <p className="mb-8 text-lg font-medium text-muted-foreground">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-12 px-8 font-bold"
          >
            Quay lại
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="h-12 px-8 font-bold shadow-lg shadow-primary/20"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
