import { useState } from "react";
import {
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  useRunPayroll,
  useRecalculatePayroll,
  type RunPayrollResult,
} from "@/features/hr/hooks/usePayrollRun";
import { PAYROLL_HR_CONSTANTS } from "./payroll.constants";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { ForbiddenPage } from "../security/ForbiddenPage";

function getCurrentPeriod(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Có lỗi xảy ra. Vui lòng thử lại.";
  }
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    e.response?.data?.message ?? e.message ?? "Có lỗi xảy ra. Vui lòng thử lại."
  );
}

interface ResultSummaryProps {
  result: RunPayrollResult;
}

function ResultSummary({ result }: ResultSummaryProps) {
  return (
    <div className="mt-8 rounded-xl border border-green-200 bg-green-50/50 p-6 dark:border-green-900 dark:bg-green-950/30">
      <div className="mb-6 flex items-center gap-3 text-green-700 dark:text-green-400">
        <div className="bg-green-100 p-2 rounded-full dark:bg-green-900/50">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold">
          Tính lương thành công — kỳ {result.period}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
          <div className="bg-blue-50 p-3 rounded-xl dark:bg-blue-900/30">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nhân viên đã tính
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {result.processedEmployees}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
          <div className="bg-emerald-50 p-3 rounded-xl dark:bg-emerald-900/30">
            <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tổng lương net
            </p>
            <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatVND(result.totalPayroll)}
            </p>
          </div>
        </div>
      </div>

      {result.skippedEmployees > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50/50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {result.skippedEmployees} nhân viên bị bỏ qua do chưa có bản ghi
          lương.
        </div>
      )}
    </div>
  );
}

export default function PayrollRunPage() {
  const role = useEffectiveRole();
  const [period, setPeriod] = useState<string>(getCurrentPeriod);
  const [lastResult, setLastResult] = useState<RunPayrollResult | null>(null);

  const runMutation = useRunPayroll();
  const recalculateMutation = useRecalculatePayroll();

  const isLoading = runMutation.isPending || recalculateMutation.isPending;

  // RBAC check: HR or ADMIN only. Derived roles "hr", "admin"
  if (role !== "hr" && role !== "admin") {
    return <ForbiddenPage />;
  }

  const handleRun = () => {
    if (!period) {
      return;
    }
    runMutation.mutate(period, {
      onSuccess: (result) => {
        setLastResult(result);
        toast.success(PAYROLL_HR_CONSTANTS.MESSAGES.RUN_SUCCESS(result.period));
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleRecalculate = () => {
    if (!period) {
      return;
    }
    recalculateMutation.mutate(period, {
      onSuccess: (result) => {
        setLastResult(result);
        toast.success(
          PAYROLL_HR_CONSTANTS.MESSAGES.RECALC_SUCCESS(result.period),
        );
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  return (
    <main className="page-layout-wrapper">
      <div className="page-header-container">
        <div>
          <h1 className="page-heading">{PAYROLL_HR_CONSTANTS.TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {PAYROLL_HR_CONSTANTS.SUBTITLE}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="shadow-md border-none ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-6 pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Thực hiện tính lương
                </CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed max-w-2xl">
                {PAYROLL_HR_CONSTANTS.DESC_RUN}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col sm:flex-row items-end gap-6 bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[200px]">
                  <label
                    htmlFor="payroll-period"
                    className="text-sm font-bold text-gray-700"
                  >
                    {PAYROLL_HR_CONSTANTS.LABEL_PERIOD}
                  </label>
                  <input
                    id="payroll-period"
                    type="month"
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value);
                      setLastResult(null);
                    }}
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-input bg-white px-4 py-2 text-base font-medium shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
                  />
                </div>

                <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleRun}
                    disabled={isLoading || !period}
                    className="h-12 flex-1 sm:flex-none sm:px-8 gap-3 font-bold text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {runMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        {PAYROLL_HR_CONSTANTS.MESSAGES.RUNNING}
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        {PAYROLL_HR_CONSTANTS.BTN_RUN}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleRecalculate}
                    disabled={isLoading || !period}
                    className="h-12 flex-1 sm:flex-none sm:px-6 gap-3 font-bold text-base bg-white transition-all hover:bg-slate-100 active:scale-[0.98]"
                  >
                    {recalculateMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        {PAYROLL_HR_CONSTANTS.MESSAGES.RECALCULATING}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5" />
                        {PAYROLL_HR_CONSTANTS.BTN_RECALCULATE}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {lastResult && <ResultSummary result={lastResult} />}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-900">
            <h3 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5" />
              Lưu ý quan trọng
            </h3>
            <ul className="space-y-3 text-sm text-amber-900/80 dark:text-amber-300/80">
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">•</span>
                Vui lòng chốt bảng công trước khi thực hiện chạy tính lương.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">•</span>
                Dữ liệu bảo hiểm và thuế TNCN sẽ được tính dựa trên cấu hình
                chính sách hiện hành.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 font-bold">•</span>
                Nếu có thay đổi về hệ số lương trong kỳ, hãy sử dụng tính năng
                "Tính lại".
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
