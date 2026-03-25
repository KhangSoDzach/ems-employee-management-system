import api from "@/lib/axios";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type AuditActionType =
  // --- AUTH ---
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_LOGOUT"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_REFRESH_SUCCESS"
  | "AUTH_TOKEN_REFRESH_FAILED"
  | "AUTH_TOKEN_REVOKED"
  | "AUTH_TOKEN_INVALID"

  // --- SECURITY ---
  | "SECURITY_ACCESS_DENIED"
  | "SECURITY_UNAUTHORIZED"
  | "SECURITY_RATE_LIMIT_EXCEEDED"
  | "SECURITY_SUSPICIOUS_ACTIVITY"

  // --- SYSTEM ---
  | "SYSTEM_SESSION_TIMEOUT"
  | "SYSTEM_FORCE_LOGOUT"
  | "SYSTEM_PASSWORD_CHANGED"

  // --- DATA ---
  | "DATA_CREATE_EMPLOYEE"
  | "DATA_UPDATE_EMPLOYEE"
  | "DATA_DELETE_EMPLOYEE"
  | "DATA_IMPORT_EMPLOYEE"
  | "DATA_EXPORT_EMPLOYEE"
  | "DATA_UPDATE_NATIONAL_ID"
  | "DATA_UPDATE_SALARY"
  | "DATA_UPDATE_BANK_INFO"
  | "DATA_UPDATE_CONTRACT"

  // --- WORKFLOW ---
  | "WORKFLOW_APPROVE_LEAVE"
  | "WORKFLOW_REJECT_LEAVE"
  | "WORKFLOW_ADJUST_ATTENDANCE"
  | "WORKFLOW_ASSET_REPORT_SUBMITTED"
  | "WORKFLOW_ASSET_REPORT_APPROVED"
  | "WORKFLOW_ASSET_REPORT_REJECTED";

export interface AuditLogItem {
  id: number;
  entityType: string;
  entityId: string | null;
  actionType: AuditActionType;
  actor: string | null;
  identifierAttempted: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  clientType: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  actionType?: AuditActionType;
  actor?: string;
  identifierAttempted?: string;
  ipAddress?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

const unwrap = <T>(response: ApiResponse<T>) => response.data;

export const auditLogService = {
  getAuditLogs: (
    filters: AuditLogFilters = {},
  ): Promise<PageResponse<AuditLogItem>> =>
    (
      api.get<unknown, ApiResponse<PageResponse<AuditLogItem>>>("/audit-logs", {
        params: filters,
      }) as Promise<ApiResponse<PageResponse<AuditLogItem>>>
    ).then(unwrap),

  getAuditLogById: (id: number): Promise<AuditLogItem> =>
    (
      api.get<unknown, ApiResponse<AuditLogItem>>(
        `/audit-logs/${id}`,
      ) as Promise<ApiResponse<AuditLogItem>>
    ).then(unwrap),
};
