import api from "@/lib/axios";

export interface PublicEmployeeProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;
  hireDate: string;
  employeeCode: string | null;
  nationalId: string | null;
  position: string | null;
  department: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  annualLeaveBalance?: number;
  sickLeaveBalance?: number;
  attendancePercentage?: number;
  avatarUrl: string | null;
  reportingManagerId: number | null;
  reportingManagerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;
  hireDate: string;
  position: string | null;
  positionId: number | null;
  department: string | null;
  departmentId: number | null;
  salary: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  taxId: string | null;
  socialSecurityNumber: string | null;
  nationalId: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
  reportingManagerId: number | null;
  reportingManagerName: string | null;
  contractType: string | null;
  probationEndDate: string | null;
  contractEndDate: string | null;
  workLocation: string | null;
  nationality: string | null;
  bloodGroup: string | null;
  gender: string | null;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  avatarUrl: string | null;
  employeeCode: string;
  terminationDate: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  hireDate: string;
  positionId: number;
  departmentId: number;
  salary: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  taxId?: string;
  socialSecurityNumber?: string;
  nationalId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  reportingManagerId?: number;
  contractType?: string;
  probationEndDate?: string;
  contractEndDate?: string;
  workLocation?: string;
  nationality?: string;
  bloodGroup?: string;
  gender?: string;
  avatarUrl?: string;
  notes?: string;
}

export interface PageParams {
  page?: number;
  size?: number;
  department?: string;
  position?: string;
  status?: string;
  search?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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
    (
      api.get<unknown, ApiResponse<PublicEmployeeProfile>>(
        "/employees/me",
      ) as Promise<ApiResponse<PublicEmployeeProfile>>
    ).then((res) => res.data),

  /**
   * GET /api/v1/employees
   * Phân trang & search
   */
  getAllEmployees: (
    params: PageParams,
  ): Promise<PageResponse<EmployeeResponse>> =>
    (
      api.get<unknown, ApiResponse<PageResponse<EmployeeResponse>>>(
        "/employees",
        { params },
      ) as Promise<ApiResponse<PageResponse<EmployeeResponse>>>
    ).then((res) => res.data),

  /**
   * GET /api/v1/employees/:id
   */
  getEmployeeById: (id: number): Promise<EmployeeResponse> =>
    (
      api.get<unknown, ApiResponse<EmployeeResponse>>(
        `/employees/${id}`,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => res.data),

  /**
   * POST /api/v1/employees
   */
  createEmployee: (data: EmployeeRequest): Promise<EmployeeResponse> =>
    (
      api.post<unknown, ApiResponse<EmployeeResponse>>(
        "/employees",
        data,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => res.data),

  /**
   * PUT /api/v1/employees/:id
   */
  updateEmployee: (
    id: number,
    data: EmployeeRequest,
  ): Promise<EmployeeResponse> =>
    (
      api.put<unknown, ApiResponse<EmployeeResponse>>(
        `/employees/${id}`,
        data,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => res.data),

  /**
   * DELETE /api/v1/employees/:id
   */
  deleteEmployee: (id: number): Promise<void> =>
    (
      api.delete<unknown, ApiResponse<void>>(`/employees/${id}`) as Promise<
        ApiResponse<void>
      >
    ).then(() => {}),
};
