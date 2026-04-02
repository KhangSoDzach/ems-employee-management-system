import api from "@/lib/axios";

export interface MemberResponse {
  id: number;
  userId: number | null;
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

export type ReviewType = "MANAGER" | "SELF" | "PEER" | "UPWARD";

export interface SaveReviewRequest {
  revieweeId: number;
  reviewType: ReviewType;
  reviewPeriod: string;
  scores: { expertise: number; communication: number; attitude: number };
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

export interface ReviewBreakdown {
  reviewId: number;
  reviewerName: string;
  reviewType: ReviewType;
  expertiseScore: number;
  communicationScore: number;
  attitudeScore: number;
  totalScore: number;
  rank: string;
  comment: string | null;
  submittedAt: string;
}

export interface AggregateReviewResponse {
  revieweeId: number;
  revieweeName: string;
  reviewPeriod: string;
  managerReview: ReviewBreakdown | null;
  selfReview: ReviewBreakdown | null;
  upwardReview: ReviewBreakdown | null;
  peerReviews: ReviewBreakdown[];
  overallScore: number | null;
  overallRank: string;
  hasManagerReview: boolean;
  hasSelfReview: boolean;
  hasUpwardReview: boolean;
  peerReviewCount: number;
  totalReviewers: number;
}

export interface OneOnOneMeetingResponse {
  id: number;
  managerId: number;
  managerName: string;
  employeeId: number;
  employeeName: string;
  meetingDate: string;
  agenda: string | null;
  notes: string | null;
  actionItems: string | null;
  nextMeetingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  employeeId: number;
  meetingDate: string;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  nextMeetingDate?: string;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

export const memberService = {
  getTeamMembers: (params: GetTeamMembersParams = {}): Promise<PageResponse<MemberResponse>> =>
    (api.get<unknown, ApiResponse<PageResponse<MemberResponse>>>("/employees/team", { params }) as
      Promise<ApiResponse<PageResponse<MemberResponse>>>).then((r) => r.data),

  getLatestReview: (employeeId: number): Promise<PerformanceReviewResponse> =>
    (api.get<unknown, ApiResponse<PerformanceReviewResponse>>(
      `/performance/reviews/latest/${employeeId}`) as
      Promise<ApiResponse<PerformanceReviewResponse>>).then((r) => r.data),

  saveReview: (payload: SaveReviewRequest): Promise<PerformanceReviewResponse> =>
    (api.post<unknown, ApiResponse<PerformanceReviewResponse>>(
      "/performance/reviews", payload) as
      Promise<ApiResponse<PerformanceReviewResponse>>).then((r) => r.data),

  getAggregate: (employeeId: number, period?: string): Promise<AggregateReviewResponse> =>
    (api.get<unknown, ApiResponse<AggregateReviewResponse>>(
      `/performance/reviews/aggregate/${employeeId}`,
      { params: period ? { period } : {} }) as
      Promise<ApiResponse<AggregateReviewResponse>>).then((r) => r.data),

  getMeetings: (employeeId: number, page = 0, size = 10): Promise<PageResponse<OneOnOneMeetingResponse>> =>
    (api.get<unknown, ApiResponse<PageResponse<OneOnOneMeetingResponse>>>(
      `/performance/one-on-one/employee/${employeeId}`,
      { params: { page, size } }) as
      Promise<ApiResponse<PageResponse<OneOnOneMeetingResponse>>>).then((r) => r.data),

  createMeeting: (payload: CreateMeetingRequest): Promise<OneOnOneMeetingResponse> =>
    (api.post<unknown, ApiResponse<OneOnOneMeetingResponse>>(
      "/performance/one-on-one", payload) as
      Promise<ApiResponse<OneOnOneMeetingResponse>>).then((r) => r.data),

  updateMeeting: (id: number, payload: CreateMeetingRequest): Promise<OneOnOneMeetingResponse> =>
    (api.put<unknown, ApiResponse<OneOnOneMeetingResponse>>(
      `/performance/one-on-one/${id}`, payload) as
      Promise<ApiResponse<OneOnOneMeetingResponse>>).then((r) => r.data),

  deleteMeeting: (id: number): Promise<void> =>
    (api.delete(`/performance/one-on-one/${id}`) as Promise<unknown>).then(() => undefined),
};