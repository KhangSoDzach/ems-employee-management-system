import api from '@/lib/axios';

// DTO khớp với backend PublicEmployeeResponse (không có trường nhạy cảm)
export interface PublicEmployeeProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;   // ISO date: "YYYY-MM-DD"
  hireDate: string;      // ISO date: "YYYY-MM-DD"
  position: string | null;
  department: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;        // "ACTIVE" | "INACTIVE" | "SUSPENDED"
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const employeeService = {
  /**
   * GET /api/v1/employees/me
   * Trả hồ sơ (read-only, public fields) của user đang đăng nhập.
   */
  getMyProfile: (): Promise<PublicEmployeeProfile> =>
    (api.get<unknown, ApiResponse<PublicEmployeeProfile>>('/employees/me') as Promise<ApiResponse<PublicEmployeeProfile>>)
      .then((res) => res.data),
};
