import api from "@/lib/axios";

type ApiResponse<T> = {
  success?: boolean;
  status?: string;
  message?: string;
  data: T;
};

export type SalaryComponentType =
  | "BASE"
  | "ALLOWANCE"
  | "COMMISSION"
  | "BONUS"
  | "DEDUCTION"
  | "INSURANCE";
export type SalaryComponentNature = "INCOME" | "DEDUCTION";
export type SalaryComponentStatus = "ACTIVE" | "INACTIVE";

export interface SalaryComponentPayload {
  code: string;
  name: string;
  type: SalaryComponentType;
  isTaxable: boolean;
  isInsurable: boolean;
  amount: number | null;
  ratePercent: number | null;
  nature: SalaryComponentNature;
  status: SalaryComponentStatus;
}

export interface SalaryComponentResponse extends SalaryComponentPayload {
  id: number;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export const salaryComponentApi = {
  getAll: async (): Promise<SalaryComponentResponse[]> => {
    const response = (await api.get("/payroll/components")) as ApiResponse<
      SalaryComponentResponse[]
    >;
    return response.data;
  },

  create: async (
    payload: SalaryComponentPayload,
  ): Promise<SalaryComponentResponse> => {
    const response = (await api.post(
      "/payroll/components",
      payload,
    )) as ApiResponse<SalaryComponentResponse>;
    return response.data;
  },

  update: async (
    id: number,
    payload: SalaryComponentPayload,
  ): Promise<SalaryComponentResponse> => {
    const response = (await api.put(
      `/payroll/components/${id}`,
      payload,
    )) as ApiResponse<SalaryComponentResponse>;
    return response.data;
  },
};
