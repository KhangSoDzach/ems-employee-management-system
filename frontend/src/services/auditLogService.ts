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

export type AuditResource =
  | "AUTH"
  | "EMPLOYEE"
  | "PAYROLL"
  | "LEAVE"
  | "ATTENDANCE"
  | "ASSET"
  | "SYSTEM";

export type AuditCategory =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "DATA_CHANGE"
  | "SECURITY";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_REFRESH"
  | "TOKEN_REFRESH_FAILED"
  | "PASSWORD_CHANGE"
  | "ACCESS_DENIED"
  | "RATE_LIMIT_EXCEEDED"
  | "SUSPICIOUS_ACTIVITY"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export interface AuditLogItem {
  id: number;
  resource: AuditResource;
  category: AuditCategory;
  action: AuditAction;
  targetId: string | null;
  identifier: string | null;
  actor: string | null;
  oldValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  clientType: string | null;
  correlationId: string | null;
  createdAt: string;
  target?: {
    id: string | null;
    name: string | null;
    type: string | null;
  };
}

export interface AuditLogFilters {
  resource?: AuditResource;
  action?: AuditAction;
  actor?: string;
  identifier?: string;
  ipAddress?: string;
  showAnonymous?: boolean;
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
