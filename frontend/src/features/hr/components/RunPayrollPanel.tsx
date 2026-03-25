import { useState } from "react";
import { Play, RefreshCw, CheckCircle2, AlertCircle, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useRunPayroll,
  useRecalculatePayroll,
  type RunPayrollResult,
} from "@/features/hr/hooks/usePayrollRun";

function getCurrentPeriod(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style:    "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Có lỗi xảy ra. Vui lòng thử lại.";
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message ?? e.message ?? "Có lỗi xảy ra. Vui lòng thử lại.";
}

interface ResultSummaryProps {
  result: RunPayrollResult;
}

function ResultSummary({ result }: ResultSummaryProps) {
  return (
    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
      <div className="mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">
          Tính lương thành công — kỳ {result.period}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Employees processed */}
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Nhân viên đã tính</p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {result.processedEmployees}
            </p>
          </div>
        </div>

        {/* Total net payroll */}
        <div className="flex items-start gap-3 sm:col-span-2">
          <Wallet className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Tổng lương net</p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {formatVND(result.totalPayroll)}
            </p>
          </div>
        </div>
      </div>

      {result.skippedEmployees > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {result.skippedEmployees} nhân viên bị bỏ qua do chưa có bản ghi lương.
        </div>
      )}
    </div>
  );
}

export function RunPayrollPanel() {
  const [period, setPeriod] = useState<string>(getCurrentPeriod);
  const [lastResult, setLastResult] = useState<RunPayrollResult | null>(null);

  const runMutation         = useRunPayroll();
  const recalculateMutation = useRecalculatePayroll();

  const isLoading = runMutation.isPending || recalculateMutation.isPending;

  const handleRun = () => {
    if (!period) return;
    runMutation.mutate(period, {
      onSuccess: (result) => {
        setLastResult(result);
        toast.success(`Tính lương kỳ ${result.period} thành công`);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleRecalculate = () => {
    if (!period) return;
    recalculateMutation.mutate(period, {
      onSuccess: (result) => {
        setLastResult(result);
        toast.success(`Tính lại lương kỳ ${result.period} thành công`);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Chạy tính lương</CardTitle>
        <CardDescription>
          Tự động tính BHXH, BHYT, BHTN và lương net cho toàn bộ
          nhân viên trong kỳ lương được chọn.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls row */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Period picker */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="payroll-period"
              className="text-sm font-medium text-foreground"
            >
              Kỳ lương
            </label>
            <input
              id="payroll-period"
              type="month"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setLastResult(null); // clear old result when period changes
              }}
              disabled={isLoading}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm
                         shadow-sm transition-colors focus:outline-none focus:ring-1
                         focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Run Payroll */}
          <Button
            onClick={handleRun}
            disabled={isLoading || !period}
            className="gap-2"
          >
            {runMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang tính lương…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Payroll
              </>
            )}
          </Button>

          {/* Recalculate (always visible — HR may need it after config change) */}
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={isLoading || !period}
            className="gap-2"
            title="Tính lại lương khi thành phần lương thay đổi (AC-03)"
          >
            {recalculateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang tính lại…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Tính lại
              </>
            )}
          </Button>
        </div>

        {/* Result summary */}
        {lastResult && <ResultSummary result={lastResult} />}
      </CardContent>
    </Card>
  );
}
