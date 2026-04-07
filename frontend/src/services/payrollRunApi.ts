import api from "@/lib/axios";

export interface RunPayrollRequest {
  period: string;
}

export interface RunPayrollResult {
  period: string;
  processedEmployees: number;
  skippedEmployees: number;
  totalPayroll: number;
  status: "SUCCESS";
}

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const payrollRunApi = {

  runPayroll: async (request: RunPayrollRequest): Promise<RunPayrollResult> => {
    const response = await api.post<unknown, ApiResponse<RunPayrollResult>>(
      "/payroll/run",
      request
    );
    return response.data;
  },

  recalculatePayroll: async (period: string): Promise<RunPayrollResult> => {
    const response = await api.post<unknown, ApiResponse<RunPayrollResult>>(
      `/payroll/recalculate/${period}`
    );
    return response.data;
  },
};
