import api from "@/lib/axios";

// ─── Shared wrapper ───────────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── DTOs matching backend LeaveRequest / LeaveResponse ──────────────────────
export interface LeaveResponseDTO {
  id: number;
  employeeId: number;
  employeeName: string | null;
  leaveType: string; // "ANNUAL" | "SICK" | "PERSONAL" | "UNPAID"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  duration: number | null;
  reason: string;
  status: string; // "PENDING_LEVEL_1" | "APPROVED" | "REJECTED" | "RETURNED_TO_EMPLOYEE" | ...
  attachmentUrl: string | null;
  createdAt: string; // ISO datetime e.g. "2026-03-01T08:30:00"
  requesterUserId?: number;
}

export interface CreateLeaveDTO {
  employeeId: number;
  leaveType: string; // uppercase "ANNUAL" | "SICK" | "PERSONAL" | "UNPAID"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  reason: string;
}

export interface LeaveApprovalDTO {
  action: "APPROVE" | "REJECT" | "SEND_BACK";
  comments?: string;
}

export interface LeaveBalanceDTO {
  id: number;
  employeeId: number;
  leaveType: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  carriedForwardDays: number;
}

export const leaveService = {
  /**
   * GET /api/v1/leaves/me – always returns current authenticated user's own leaves.
   */
  getMyLeaves: (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<LeaveResponseDTO>> =>
    (
      api.get<unknown, ApiResponse<PageResponse<LeaveResponseDTO>>>(
        "/leaves/me",
        { params },
      ) as Promise<ApiResponse<PageResponse<LeaveResponseDTO>>>
    ).then((res) => res.data),

  /**
   * GET /api/v1/leave-balances – current user's leave balances for current year.
   */
  getMyLeaveBalances: (): Promise<LeaveBalanceDTO[]> =>
    (
      api.get<unknown, ApiResponse<LeaveBalanceDTO[]>>(
        "/leave-balances",
      ) as Promise<ApiResponse<LeaveBalanceDTO[]>>
    ).then((res) => res.data),

  /**
   * GET /api/v1/leaves – for manager: backend scopes to team automatically.
   */
  getTeamLeaves: (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<LeaveResponseDTO>> =>
    (
      api.get<unknown, ApiResponse<PageResponse<LeaveResponseDTO>>>("/leaves", {
        params,
      }) as Promise<ApiResponse<PageResponse<LeaveResponseDTO>>>
    ).then((res) => res.data),

  /**
   * POST /api/v1/leaves – submit a new leave request.
   */
  createLeave: (dto: CreateLeaveDTO): Promise<LeaveResponseDTO> =>
    (
      api.post<unknown, ApiResponse<LeaveResponseDTO>>(
        "/leaves",
        dto,
      ) as Promise<ApiResponse<LeaveResponseDTO>>
    ).then((res) => res.data),

  /**
   * PUT /api/v1/leaves/{id}/action – APPROVE / REJECT / SEND_BACK.
   */
  processAction: (
    id: number,
    dto: LeaveApprovalDTO,
  ): Promise<LeaveResponseDTO> =>
    (
      api.put<unknown, ApiResponse<LeaveResponseDTO>>(
        `/leaves/${id}/action`,
        dto,
      ) as Promise<ApiResponse<LeaveResponseDTO>>
    ).then((res) => res.data),

  /**
   * DELETE /api/v1/leaves/{id} – cancel own pending leave request.
   */
  cancelLeave: (id: number): Promise<void> =>
    (
      api.delete<unknown, ApiResponse<void>>(`/leaves/${id}`) as Promise<
        ApiResponse<void>
      >
    ).then(() => undefined),
};
