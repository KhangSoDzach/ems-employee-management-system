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

// ─── Attendance DTOs ──────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  date: string; // "YYYY-MM-DD"
  checkInTime: string | null; // ISO datetime
  checkOutTime: string | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";
  checkInMethod: "CAMERA_GEO" | "MANUAL" | "QR_CODE" | null;
  workHours: number | null; // in minutes
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

export interface AttendanceCalendarMetric {
  current: number;
  changePercent: number;
}

export interface AttendanceCalendarDay {
  date: string;
  hasRecord: boolean;
  status: "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: number | null;
  isLate: boolean | null;
  missingClockOut: boolean | null;
  checkInMethod: "CAMERA_GEO" | "MANUAL" | "QR_CODE" | null;
  notes: string | null;
}

export interface AttendanceCalendarData {
  employeeId: number;
  employeeName: string;
  month: string;
  fullWorkDays: AttendanceCalendarMetric;
  lateDays: AttendanceCalendarMetric;
  noClockOutDays: AttendanceCalendarMetric;
  absentDays: AttendanceCalendarMetric;
  days: AttendanceCalendarDay[];
}

const FULL_WORK_DAY_MINUTES = 8 * 60;

function countFullWorkDays(records: AttendanceRecord[]): number {
  return records.filter(
    (record) => (record.workHours ?? 0) >= FULL_WORK_DAY_MINUTES,
  ).length;
}

function countNoClockOutDays(records: AttendanceRecord[]): number {
  return records.filter((record) => record.checkInTime && !record.checkOutTime)
    .length;
}

function buildMetric(
  current: number,
  previous: number,
): AttendanceCalendarMetric {
  const changePercent =
    previous > 0 ? ((current - previous) * 100) / previous : 0;
  return {
    current,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

function toCalendarDay(record: AttendanceRecord): AttendanceCalendarDay {
  return {
    date: record.date,
    hasRecord: true,
    status: record.status,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
    workHours: record.workHours,
    isLate: record.isLate,
    missingClockOut: Boolean(record.checkInTime && !record.checkOutTime),
    checkInMethod: record.checkInMethod,
    notes: record.notes,
  };
}

async function getCalendarFallback(params?: {
  employeeId?: number;
  month?: string;
}): Promise<AttendanceCalendarData> {
  const fallbackNow = new Date();
  const monthPattern = /^\d{4}-\d{2}$/;
  const month = monthPattern.test(params?.month ?? "")
    ? (params?.month as string)
    : `${fallbackNow.getFullYear()}-${String(fallbackNow.getMonth() + 1).padStart(2, "0")}`;

  const [yearPart, monthPart] = month.split("-");
  const year = Number(yearPart);
  const monthNum = Number(monthPart);

  const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().slice(0, 10);

  const prevDate = new Date(year, monthNum - 2, 1);
  const prevStartDate = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-01`;
  const prevEndDate = new Date(
    prevDate.getFullYear(),
    prevDate.getMonth() + 1,
    0,
  )
    .toISOString()
    .slice(0, 10);

  const [currentSummary, previousSummary, currentRecords, previousRecords] =
    await Promise.all([
      attendanceService.getSummary({
        employeeId: params?.employeeId,
        startDate,
        endDate,
      }),
      attendanceService.getSummary({
        employeeId: params?.employeeId,
        startDate: prevStartDate,
        endDate: prevEndDate,
      }),
      attendanceService.getAttendance({
        employeeId: params?.employeeId,
        startDate,
        endDate,
        page: 0,
        size: 200,
      }),
      attendanceService.getAttendance({
        employeeId: params?.employeeId,
        startDate: prevStartDate,
        endDate: prevEndDate,
        page: 0,
        size: 200,
      }),
    ]);

  const currentRows = currentRecords.content;
  const previousRows = previousRecords.content;

  return {
    employeeId: currentSummary.employeeId,
    employeeName: currentSummary.employeeName,
    month,
    fullWorkDays: buildMetric(
      countFullWorkDays(currentRows),
      countFullWorkDays(previousRows),
    ),
    lateDays: buildMetric(currentSummary.lateDays, previousSummary.lateDays),
    noClockOutDays: buildMetric(
      countNoClockOutDays(currentRows),
      countNoClockOutDays(previousRows),
    ),
    absentDays: buildMetric(
      currentSummary.absentDays,
      previousSummary.absentDays,
    ),
    days: currentRows.map(toCalendarDay),
  };
}

// ─── Check-in / Check-out request ─────────────────────────────────────────────
export interface CheckInPayload {
  latitude: number;
  longitude: number;
  photoBase64: string;
  locationLabel?: string;
  checkInMethod?: "CAMERA_GEO";
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
  | "PENDING_LEVEL_1"
  | "PENDING_LEVEL_2"
  | "PENDING_LEVEL_3"
  | "PENDING_LEVEL_4"
  | "PENDING_LEVEL_5"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED_TO_EMPLOYEE";

export type AdjustmentReason =
  | "DEVICE_ERROR"
  | "FORGOT_CHECKIN"
  | "FORGOT_CHECKOUT"
  | "SYSTEM_ERROR"
  | "OTHER";

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
  requestDate: string; // "YYYY-MM-DD"
  proposedCheckInTime?: string; // ISO datetime or null
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
    api
      .post<
        unknown,
        ApiResponse<AttendanceRecord>
      >("/attendance/check-in", payload)
      .then(r),

  checkOut: (payload: CheckOutPayload): Promise<AttendanceRecord> =>
    api
      .post<
        unknown,
        ApiResponse<AttendanceRecord>
      >("/attendance/check-out", payload)
      .then(r),

  // ── History & summary ───────────────────────────────────────────────────────
  getAttendance: (params?: {
    page?: number;
    size?: number;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<PageResponse<AttendanceRecord>> =>
    api
      .get<
        unknown,
        ApiResponse<PageResponse<AttendanceRecord>>
      >("/attendance", { params })
      .then(r),

  getSummary: (params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceSummary> =>
    api
      .get<
        unknown,
        ApiResponse<AttendanceSummary>
      >("/attendance/summary", { params })
      .then(r),

  getCalendar: (params?: {
    employeeId?: number;
    month?: string;
  }): Promise<AttendanceCalendarData> =>
    api
      .get<unknown, ApiResponse<AttendanceCalendarData>>(
        "/attendance/calendar",
        { params },
      )
      .then(r)
      .catch(async (error) => {
        const status = error?.response?.status;
        if (status === 404 || status === 500) {
          return getCalendarFallback(params);
        }
        throw error;
      }),

  // ── Adjustment requests (employee) ──────────────────────────────────────────
  submitAdjustment: (
    payload: CreateAdjustmentPayload,
  ): Promise<AdjustmentRequestDetail> =>
    api
      .post<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >("/attendance/adjustments", payload)
      .then(r),

  resubmitAdjustment: (
    requestId: number,
    payload: CreateAdjustmentPayload,
  ): Promise<AdjustmentRequestDetail> =>
    api
      .put<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >(`/attendance/adjustments/${requestId}/resubmit`, payload)
      .then(r),

  getMyAdjustments: (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdjustmentRequestSummary>> =>
    api
      .get<
        unknown,
        ApiResponse<PageResponse<AdjustmentRequestSummary>>
      >("/attendance/adjustments/my", { params })
      .then(r),

  getAdjustmentDetail: (requestId: number): Promise<AdjustmentRequestDetail> =>
    api
      .get<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >(`/attendance/adjustments/${requestId}`)
      .then(r),

  // ── Adjustment requests (approver) ──────────────────────────────────────────
  getPendingAdjustments: (params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<AdjustmentRequestSummary>> =>
    api
      .get<
        unknown,
        ApiResponse<PageResponse<AdjustmentRequestSummary>>
      >("/attendance/adjustments/pending", { params })
      .then(r),

  approveAdjustment: (
    requestId: number,
    payload: ApprovalActionPayload,
  ): Promise<AdjustmentRequestDetail> =>
    api
      .post<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >(`/attendance/adjustments/${requestId}/approve`, payload)
      .then(r),

  rejectAdjustment: (
    requestId: number,
    payload: ApprovalActionPayload,
  ): Promise<AdjustmentRequestDetail> =>
    api
      .post<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >(`/attendance/adjustments/${requestId}/reject`, payload)
      .then(r),

  returnAdjustment: (
    requestId: number,
    payload: ApprovalActionPayload,
  ): Promise<AdjustmentRequestDetail> =>
    api
      .post<
        unknown,
        ApiResponse<AdjustmentRequestDetail>
      >(`/attendance/adjustments/${requestId}/return`, payload)
      .then(r),
};
