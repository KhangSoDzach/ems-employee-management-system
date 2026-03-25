import api from "@/lib/axios";

type ApiResponse<T> = { success: boolean; message?: string; data: T };

export interface PayrollSummaryRow {
  payrollId:           number;
  employeeCode:        string;
  employeeName:        string;
  department:          string;
  period:              string;
  basicSalary:         number;
  allowances:          number;
  insuranceDeduction:  number;
  taxDeduction:        number;
  netPay:              number;
  status:              string;
}

export interface PeriodPayrollResult {
  period:           string;
  totalEmployees:   number;
  totalNetPayroll:  number;
  payrolls:         PayrollSummaryRow[];
}

export const payrollPeriodApi = {
  /** GET /api/v1/payroll/period/{period} */
  getByPeriod: async (period: string): Promise<PeriodPayrollResult> => {
    const res = await api.get<unknown, ApiResponse<PeriodPayrollResult>>(
      `/payroll/period/${period}`
    );
    return res.data;
  },

  /** GET /api/v1/payroll/period/{period}/export → trigger file download */
  exportCsv: (period: string): void => {
    const token = localStorage.getItem("access_token");
    const url   = `${import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"}/payroll/period/${period}/export`;

    // Use hidden anchor with Authorization header workaround
    // For streaming CSV the cleanest approach is fetch + blob
    fetch(url, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then(res => {
        if (!res.ok) { throw new Error(`Export failed: ${res.status}`) }
        return res.blob();
      })
      .then(blob => {
        const href = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = href;
        a.download = `bang-luong-${period}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(href), 10_000);
      })
      .catch(err => console.error("CSV export error:", err));
  },
};
