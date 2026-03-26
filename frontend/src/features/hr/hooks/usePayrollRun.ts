import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollRunApi, type RunPayrollResult } from "@/services/payrollRunApi";

export type { RunPayrollResult };

export const PAYROLL_QUERY_KEY = "payroll-results";
export function useRunPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: string) => payrollRunApi.runPayroll({ period }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
    },
  });
}

export function useRecalculatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: string) => payrollRunApi.recalculatePayroll(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAYROLL_QUERY_KEY] });
    },
  });
}
