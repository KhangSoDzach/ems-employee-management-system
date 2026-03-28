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
  | "LOGIN_SUCCESS"
  | "PASSWORD_CHANGED"
  | "LOGIN_FAILED"
  | "TOKEN_REFRESH_SUCCESS"
  | "TOKEN_REFRESH_FAILED"
  | "LOGOUT"
  | "TOKEN_REVOKED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "ACCESS_DENIED"
  | "ASSET_REPORT_SUBMITTED"
  | "ASSET_REPORT_APPROVED"
  | "ASSET_REPORT_REJECTED";

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
