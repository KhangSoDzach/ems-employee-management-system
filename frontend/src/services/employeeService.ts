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
  contractStartDate: string | null;
  probationEndDate: string | null;
  contractEndDate: string | null;
  contractDurationMonths: number | null;
  probationSalary: number | null;
  officialSalary: number | null;
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
  workStatus: "PROBATION" | "ACTIVE" | "TERMINATED" | null;
  isDeleted: boolean | null;
  deletedAt: string | null;
  deletedBy: string | null;
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
  contractStartDate?: string;
  probationEndDate?: string;
  contractEndDate?: string;
  contractDurationMonths?: number;
  workStatus?: "PROBATION" | "ACTIVE" | "TERMINATED";
  probationSalary?: number;
  officialSalary?: number;
  workLocation?: string;
  nationality?: string;
  bloodGroup?: string;
  gender?: string;
  avatarUrl?: string;
  notes?: string;
}

export interface OfficialContractRequest {
  contractStartDate: string;
  contractTerm: "ONE_YEAR" | "TWO_YEARS" | "THREE_YEARS" | "INDEFINITE";
  officialSalary: number;
}

export interface EmployeeAttachmentResponse {
  id: number;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface PageParams {
  page?: number;
  size?: number;
  department?: string;
  position?: string;
  status?: string;
  search?: string;
  includeDeleted?: boolean;
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

const getApiOrigin = (): string => {
  const currentOrigin = globalThis.location?.origin ?? "http://localhost:8080";
  const baseURL = api.defaults.baseURL;
  if (typeof baseURL !== "string" || !baseURL.trim()) {
    return currentOrigin;
  }

  try {
    return new URL(baseURL, currentOrigin).origin;
  } catch {
    return currentOrigin;
  }
};

const resolveEmployeeFileUrl = (
  url: string | null | undefined,
): string | null => {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

const normalizeEmployeeResponse = (
  employee: EmployeeResponse,
): EmployeeResponse => ({
  ...employee,
  avatarUrl: resolveEmployeeFileUrl(employee.avatarUrl),
});

const normalizePublicProfile = (
  profile: PublicEmployeeProfile,
): PublicEmployeeProfile => ({
  ...profile,
  avatarUrl: resolveEmployeeFileUrl(profile.avatarUrl),
});

const normalizeAttachment = (
  attachment: EmployeeAttachmentResponse,
): EmployeeAttachmentResponse => ({
  ...attachment,
  fileUrl: resolveEmployeeFileUrl(attachment.fileUrl) ?? attachment.fileUrl,
});

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
    ).then((res) => normalizePublicProfile(res.data)),

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
    ).then((res) => ({
      ...res.data,
      content: res.data.content.map(normalizeEmployeeResponse),
    })),

  /**
   * GET /api/v1/employees/:id
   */
  getEmployeeById: (id: number): Promise<EmployeeResponse> =>
    (
      api.get<unknown, ApiResponse<EmployeeResponse>>(
        `/employees/${id}`,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => normalizeEmployeeResponse(res.data)),

  /**
   * POST /api/v1/employees
   */
  createEmployee: (data: EmployeeRequest): Promise<EmployeeResponse> =>
    (
      api.post<unknown, ApiResponse<EmployeeResponse>>(
        "/employees",
        data,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => normalizeEmployeeResponse(res.data)),

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
    ).then((res) => normalizeEmployeeResponse(res.data)),

  /**
   * DELETE /api/v1/employees/:id
   */
  deleteEmployee: (id: number): Promise<void> =>
    (
      api.delete<unknown, ApiResponse<void>>(`/employees/${id}`) as Promise<
        ApiResponse<void>
      >
    ).then(() => {}),

  convertToOfficial: (
    id: number,
    data: OfficialContractRequest,
  ): Promise<EmployeeResponse> =>
    (
      api.patch<unknown, ApiResponse<EmployeeResponse>>(
        `/employees/${id}/official-contract`,
        data,
      ) as Promise<ApiResponse<EmployeeResponse>>
    ).then((res) => normalizeEmployeeResponse(res.data)),

  uploadEmployeeFile: (
    id: number,
    file: File,
    fileType: "AVATAR" | "DOCUMENT" = "DOCUMENT",
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    return (
      api.post<unknown, ApiResponse<string>>(
        `/employees/${id}/files`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      ) as Promise<ApiResponse<string>>
    ).then((res) => resolveEmployeeFileUrl(res.data) ?? res.data);
  },

  getEmployeeFiles: (id: number): Promise<EmployeeAttachmentResponse[]> =>
    (
      api.get<unknown, ApiResponse<EmployeeAttachmentResponse[]>>(
        `/employees/${id}/files`,
      ) as Promise<ApiResponse<EmployeeAttachmentResponse[]>>
    ).then((res) => res.data.map(normalizeAttachment)),

  getMyEmployeeFiles: (): Promise<EmployeeAttachmentResponse[]> =>
    (
      api.get<unknown, ApiResponse<EmployeeAttachmentResponse[]>>(
        "/employees/me/files",
      ) as Promise<ApiResponse<EmployeeAttachmentResponse[]>>
    ).then((res) => res.data.map(normalizeAttachment)),

  deleteEmployeeFile: (id: number, fileId: number): Promise<void> =>
    (
      api.delete<unknown, ApiResponse<void>>(
        `/employees/${id}/files/${fileId}`,
      ) as Promise<ApiResponse<void>>
    ).then(() => {}),

  restoreEmployee: (id: number): Promise<void> =>
    (
      api.post<unknown, ApiResponse<void>>(
        `/employees/${id}/restore`,
      ) as Promise<ApiResponse<void>>
    ).then(() => {}),
};
