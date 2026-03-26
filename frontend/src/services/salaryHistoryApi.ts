import api from "@/lib/axios";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export interface PayrollSlipApi {
  id: number;
  period: string;
  paymentDate: string;
  baseSalary: string;
  allowances: Array<{ label: string; amount: string }>;
  bonus:      Array<{ label: string; amount: string }>;
  deductions: Array<{ label: string; amount: string }>;
  totalIncome: string;
  totalDeductions: string;
  netPay: string;
  status: "paid" | "pending";
}

export const salaryHistoryApi = {
  getMyHistory: async (): Promise<PayrollSlipApi[]> => {
    const res = await api.get<unknown, ApiResponse<PayrollSlipApi[]>>(
      "/payroll/my-history"
    );
    return res.data ?? [];
  },
};
