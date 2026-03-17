import api from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Slim member projection returned by GET /api/v1/employees/team */
export interface MemberResponse {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  positionTitle: string | null;
  departmentName: string | null;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GetTeamMembersParams {
  page?: number;
  size?: number;
  search?: string;
}

// ─── Performance Review Types ─────────────────────────────────────────────────

export type ReviewType = "MANAGER" | "SELF" | "PEER";

export interface ScoresRequest {
  expertise: number;
  communication: number;
  attitude: number;
}

export interface SaveReviewRequest {
  revieweeId: number;
  reviewType: ReviewType;
  /** Format: 2026-Q1 | 2026-H1 | 2026-ANNUAL */
  reviewPeriod: string;
  scores: ScoresRequest;
  comment?: string;
}

export interface PerformanceReviewResponse {
  id: number | null;
  reviewerId: number | null;
  reviewerUsername: string | null;
  revieweeId: number | null;
  revieweeUsername: string | null;
  reviewType: ReviewType | null;
  reviewPeriod: string | null;
  expertiseScore: number;
  communicationScore: number;
  attitudeScore: number;
  totalScore: number;
  rank: string | null;
  comment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ─── Internal wrapper ─────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Service methods ──────────────────────────────────────────────────────────

export const memberService = {
  /**
   * GET /api/v1/employees/team
   * Returns the paginated list of employees under the logged-in Manager's team.
   * Managers only see their direct reports (DataScope=TEAM).
   * HR/Admin see all employees.
   */
  getTeamMembers: (
    params: GetTeamMembersParams = {},
  ): Promise<PageResponse<MemberResponse>> =>
    (
      api.get<unknown, ApiResponse<PageResponse<MemberResponse>>>(
        "/employees/team",
        { params },
      ) as Promise<ApiResponse<PageResponse<MemberResponse>>>
    ).then((res) => res.data),

  /**
   * GET /api/v1/performance/reviews/latest/{employeeId}
   * Returns the most recent performance review for the given employee.
   * If none exists, the backend returns zeros with rank="Chưa có đánh giá".
   */
  getLatestReview: (employeeId: number): Promise<PerformanceReviewResponse> =>
    (
      api.get<unknown, ApiResponse<PerformanceReviewResponse>>(
        `/performance/reviews/latest/${employeeId}`,
      ) as Promise<ApiResponse<PerformanceReviewResponse>>
    ).then((res) => res.data),

  /**
   * POST /api/v1/performance/reviews
   * Saves (or updates) an evaluation. Duplicate period + reviewer + reviewee raises a 409.
   */
  saveReview: (
    payload: SaveReviewRequest,
  ): Promise<PerformanceReviewResponse> =>
    (
      api.post<unknown, ApiResponse<PerformanceReviewResponse>>(
        "/performance/reviews",
        payload,
      ) as Promise<ApiResponse<PerformanceReviewResponse>>
    ).then((res) => res.data),
};
