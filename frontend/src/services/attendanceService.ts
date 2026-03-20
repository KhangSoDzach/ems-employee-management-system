import api from '@/lib/axios';
import { MOCK_ADJUSTMENT_REQUESTS, MOCK_ADJUSTMENT_DETAILS } from './mockData';

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

// ─── Attendance DTOs ──────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  date: string;              // "YYYY-MM-DD"
  checkInTime: string | null;  // ISO datetime
  checkOutTime: string | null;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
  checkInMethod: 'CAMERA_GEO' | 'MANUAL' | 'QR_CODE' | null;
  workHours: number | null;  // in minutes
  workHoursDecimal: number | null;
  isLate: boolean;
  isOvertime: boolean;
  overtimeMinutes: number | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInLocation: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  checkOutLocation: string | null;
  checkInPhotoUrl: string | null;
  checkOutPhotoUrl: string | null;
  notes: string | null;
  isRemote: boolean;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  attendancePercentage: number;
  totalWorkHours: number;
}

// ─── Check-in / Check-out request ─────────────────────────────────────────────
export interface CheckInPayload {
  latitude: number;
  longitude: number;
  photoBase64: string;
  locationLabel?: string;
  checkInMethod?: 'CAMERA_GEO';
  notes?: string;
}

export interface CheckOutPayload {
  latitude: number;
  longitude: number;
  photoBase64: string;
  locationLabel?: string;
  notes?: string;
}

// ─── Adjustment DTOs ──────────────────────────────────────────────────────────
export type AdjustmentStatus =
  | 'PENDING_LEVEL_1' | 'PENDING_LEVEL_2' | 'PENDING_LEVEL_3'
  | 'PENDING_LEVEL_4' | 'PENDING_LEVEL_5'
  | 'APPROVED' | 'REJECTED' | 'RETURNED_TO_EMPLOYEE';

export type AdjustmentReason =
  | 'DEVICE_ERROR' | 'FORGOT_CHECKIN' | 'FORGOT_CHECKOUT' | 'SYSTEM_ERROR' | 'OTHER';

export interface AdjustmentHistoryEntry {
  id: number;
  actionByName: string;
  actionByUserId: number | null;
  action: string;
  levelActedOn: number | null;
  comment: string | null;
  actionAt: string;
  statusBefore: string | null;
  statusAfter: string | null;
}

export interface AdjustmentRequestSummary {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  requestDate: string;
  proposedCheckInTime: string | null;
  proposedCheckOutTime: string | null;
  reasonType: AdjustmentReason;
  reasonText: string;
  status: AdjustmentStatus;
  currentApprovalLevel: number;
  maxApprovalLevel: number;
  createdAt: string;
}

export interface AdjustmentRequestDetail extends AdjustmentRequestSummary {
  attendanceId: number | null;
  incidentGeoLog: string | null;
  incidentPhotoUrl: string | null;
  requiresManualReview: boolean;
  resolvedAt: string | null;
  resolvedByName: string | null;
  history: AdjustmentHistoryEntry[];
}

export interface CreateAdjustmentPayload {
  requestDate: string;               // "YYYY-MM-DD"
  proposedCheckInTime?: string;      // ISO datetime or null
  proposedCheckOutTime?: string;
  reasonType: AdjustmentReason;
  reasonText: string;
  incidentGeoLog?: string;
  incidentPhotoBase64?: string;
  reportsMissingGeoOrPhoto?: boolean;
}

export interface ApprovalActionPayload {
  reason?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
const r = <T>(res: ApiResponse<T>) => res.data;

export const attendanceService = {
  // ── Check-in / out ──────────────────────────────────────────────────────────
  checkIn: (payload: CheckInPayload): Promise<AttendanceRecord> =>
    (api.post<unknown, ApiResponse<AttendanceRecord>>('/attendance/check-in', payload) as Promise<ApiResponse<AttendanceRecord>>).then(r),

  checkOut: (payload: CheckOutPayload): Promise<AttendanceRecord> =>
    (api.post<unknown, ApiResponse<AttendanceRecord>>('/attendance/check-out', payload) as Promise<ApiResponse<AttendanceRecord>>).then(r),

  // ── History & summary ───────────────────────────────────────────────────────
  getAttendance: (params?: {
    page?: number; size?: number;
    employeeId?: number;
    startDate?: string; endDate?: string;
    status?: string;
  }): Promise<PageResponse<AttendanceRecord>> =>
    (api.get<unknown, ApiResponse<PageResponse<AttendanceRecord>>>('/attendance', { params }) as Promise<ApiResponse<PageResponse<AttendanceRecord>>>).then(r),

  getSummary: (params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceSummary> =>
    (api.get<unknown, ApiResponse<AttendanceSummary>>('/attendance/summary', { params }) as Promise<ApiResponse<AttendanceSummary>>).then(r),

  // ── Adjustment requests (employee) ──────────────────────────────────────────
  submitAdjustment: (payload: CreateAdjustmentPayload): Promise<AdjustmentRequestDetail> =>
    (api.post<unknown, ApiResponse<AdjustmentRequestDetail>>('/attendance/adjustments', payload) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r),

  resubmitAdjustment: (requestId: number, payload: CreateAdjustmentPayload): Promise<AdjustmentRequestDetail> =>
    (api.put<unknown, ApiResponse<AdjustmentRequestDetail>>(`/attendance/adjustments/${requestId}/resubmit`, payload) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r),

  getMyAdjustments: (params?: { page?: number; size?: number }): Promise<PageResponse<AdjustmentRequestSummary>> =>
    (api.get<unknown, ApiResponse<PageResponse<AdjustmentRequestSummary>>>('/attendance/adjustments/my', { params }) as Promise<ApiResponse<PageResponse<AdjustmentRequestSummary>>>).then(r),

  getAdjustmentDetail: (requestId: number): Promise<AdjustmentRequestDetail> =>
    (api.get<unknown, ApiResponse<AdjustmentRequestDetail>>(`/attendance/adjustments/${requestId}`) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r)
    .catch(() => MOCK_ADJUSTMENT_DETAILS[requestId] || Promise.reject("Not found")),

  // ── Adjustment requests (approver) ──────────────────────────────────────────
  getPendingAdjustments: (params?: { page?: number; size?: number }): Promise<PageResponse<AdjustmentRequestSummary>> =>
    (api.get<unknown, ApiResponse<PageResponse<AdjustmentRequestSummary>>>('/attendance/adjustments/pending', { params }) as Promise<ApiResponse<PageResponse<AdjustmentRequestSummary>>>).then((res) => {
      const data = res.data;
      return {
        ...data,
        content: [...MOCK_ADJUSTMENT_REQUESTS, ...data.content],
        totalElements: data.totalElements + MOCK_ADJUSTMENT_REQUESTS.length,
      };
    })
    .catch(() => ({
      content: MOCK_ADJUSTMENT_REQUESTS,
      page: 0,
      size: 10,
      totalElements: MOCK_ADJUSTMENT_REQUESTS.length,
      totalPages: 1,
      first: true,
      last: true,
    })),

  approveAdjustment: (requestId: number, payload: ApprovalActionPayload): Promise<AdjustmentRequestDetail> =>
    (api.post<unknown, ApiResponse<AdjustmentRequestDetail>>(`/attendance/adjustments/${requestId}/approve`, payload) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r),

  rejectAdjustment: (requestId: number, payload: ApprovalActionPayload): Promise<AdjustmentRequestDetail> =>
    (api.post<unknown, ApiResponse<AdjustmentRequestDetail>>(`/attendance/adjustments/${requestId}/reject`, payload) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r),

  returnAdjustment: (requestId: number, payload: ApprovalActionPayload): Promise<AdjustmentRequestDetail> =>
    (api.post<unknown, ApiResponse<AdjustmentRequestDetail>>(`/attendance/adjustments/${requestId}/return`, payload) as Promise<ApiResponse<AdjustmentRequestDetail>>).then(r),
};
