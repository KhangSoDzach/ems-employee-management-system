import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  auditLogService,
  type AuditActionType,
  type AuditLogItem,
} from "@/services/auditLogService";

const PAGE_SIZE = 20;

const ACTION_OPTIONS: Array<{ value: AuditActionType; label: string }> = [
  // --- AUTH ---
  { value: "AUTH_LOGIN_SUCCESS", label: "Đăng nhập thành công" },
  { value: "AUTH_LOGIN_FAILED", label: "Đăng nhập thất bại" },
  { value: "AUTH_LOGOUT", label: "Đăng xuất" },
  { value: "AUTH_TOKEN_EXPIRED", label: "Token hết hạn" },
  { value: "AUTH_TOKEN_REFRESH_SUCCESS", label: "Làm mới token thành công" },
  { value: "AUTH_TOKEN_REFRESH_FAILED", label: "Làm mới token thất bại" },
  { value: "AUTH_TOKEN_REVOKED", label: "Thu hồi token" },
  { value: "AUTH_TOKEN_INVALID", label: "Token không hợp lệ" },

  // --- SECURITY ---
  { value: "SECURITY_ACCESS_DENIED", label: "Từ chối truy cập" },
  { value: "SECURITY_UNAUTHORIZED", label: "Chưa xác thực" },
  { value: "SECURITY_RATE_LIMIT_EXCEEDED", label: "Vượt quá giới hạn rate limit" },
  { value: "SECURITY_SUSPICIOUS_ACTIVITY", label: "Hành vi đáng ngờ" },

  // --- SYSTEM ---
  { value: "SYSTEM_SESSION_TIMEOUT", label: "Hết hạn phiên đăng nhập" },
  { value: "SYSTEM_FORCE_LOGOUT", label: "Văng xuất bắt buộc" },
  { value: "SYSTEM_PASSWORD_CHANGED", label: "Đổi mật khẩu" },

  // --- DATA ---
  { value: "DATA_CREATE_EMPLOYEE", label: "Tạo mới nhân viên" },
  { value: "DATA_UPDATE_EMPLOYEE", label: "Cập nhật nhân viên" },
  { value: "DATA_DELETE_EMPLOYEE", label: "Xóa nhân viên" },
  { value: "DATA_IMPORT_EMPLOYEE", label: "Import dữ liệu nhân viên" },
  { value: "DATA_EXPORT_EMPLOYEE", label: "Export dữ liệu nhân viên" },
  { value: "DATA_UPDATE_NATIONAL_ID", label: "Cập nhật CCCD" },
  { value: "DATA_UPDATE_SALARY", label: "Cập nhật mức lương" },
  { value: "DATA_UPDATE_BANK_INFO", label: "Cập nhật thông tin ngân hàng" },
  { value: "DATA_UPDATE_CONTRACT", label: "Cập nhật hợp đồng" },

  // --- WORKFLOW ---
  { value: "WORKFLOW_APPROVE_LEAVE", label: "Duyệt đơn nghỉ phép" },
  { value: "WORKFLOW_REJECT_LEAVE", label: "Từ chối đơn nghỉ phép" },
  { value: "WORKFLOW_ADJUST_ATTENDANCE", label: "Điều chỉnh chấm công" },
  { value: "WORKFLOW_ASSET_REPORT_SUBMITTED", label: "Gửi báo cáo sự cố" },
  { value: "WORKFLOW_ASSET_REPORT_APPROVED", label: "Duyệt báo cáo sự cố" },
  { value: "WORKFLOW_ASSET_REPORT_REJECTED", label: "Từ chối báo cáo sự cố" },
];

type FilterState = {
  actor: string;
  actionType: string;
  ipAddress: string;
  from: string;
  to: string;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return value;
  }
}

function toIsoLocal(dateTimeLocal: string): string | undefined {
  if (!dateTimeLocal) {
    return undefined;
  }
  return dateTimeLocal.length === 16 ? `${dateTimeLocal}:00` : dateTimeLocal;
}

function maskIdentifier(identifier: string | null): string {
  if (!identifier) {
    return "—";
  }
  if (identifier.includes("@")) {
    const [left, right] = identifier.split("@");
    if (!left) {
      return `***@${right}`;
    }
    if (left.length <= 2) {
      return `***@${right}`;
    }
    return `${left.slice(0, 2)}***@${right}`;
  }
  if (identifier.length <= 4) {
    return "****";
  }
  return `${identifier.slice(0, 2)}***${identifier.slice(-2)}`;
}

const LEGACY_ACTION_MAPPING: Record<string, AuditActionType> = {
  "LOGIN_SUCCESS": "AUTH_LOGIN_SUCCESS",
  "LOGIN_FAILED": "AUTH_LOGIN_FAILED",
  "PASSWORD_CHANGED": "SYSTEM_PASSWORD_CHANGED",
  "TOKEN_REFRESH_SUCCESS": "AUTH_TOKEN_REFRESH_SUCCESS",
  "TOKEN_REFRESH_FAILED": "AUTH_TOKEN_REFRESH_FAILED",
  "LOGOUT": "AUTH_LOGOUT",
  "TOKEN_REVOKED": "AUTH_TOKEN_REVOKED",
  "TOKEN_EXPIRED": "AUTH_TOKEN_EXPIRED",
  "TOKEN_INVALID": "AUTH_TOKEN_INVALID",
  "ACCESS_DENIED": "SECURITY_ACCESS_DENIED",
  "ASSET_REPORT_SUBMITTED": "WORKFLOW_ASSET_REPORT_SUBMITTED",
  "ASSET_REPORT_APPROVED": "WORKFLOW_ASSET_REPORT_APPROVED",
  "ASSET_REPORT_REJECTED": "WORKFLOW_ASSET_REPORT_REJECTED"
};

function actionBadgeClass(action: string): string {
  const normalizedAction = LEGACY_ACTION_MAPPING[action] || action;
  if (
    normalizedAction.includes("FAILED") ||
    normalizedAction === "SECURITY_ACCESS_DENIED" ||
    normalizedAction === "SECURITY_UNAUTHORIZED" ||
    normalizedAction === "SECURITY_RATE_LIMIT_EXCEEDED" ||
    normalizedAction === "WORKFLOW_REJECT_LEAVE" ||
    normalizedAction === "WORKFLOW_ASSET_REPORT_REJECTED" ||
    normalizedAction === "DATA_DELETE_EMPLOYEE" ||
    normalizedAction === "SYSTEM_FORCE_LOGOUT"
  ) {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (
    normalizedAction.includes("SUCCESS") ||
    normalizedAction === "SYSTEM_PASSWORD_CHANGED" ||
    normalizedAction === "WORKFLOW_APPROVE_LEAVE" ||
    normalizedAction === "WORKFLOW_ASSET_REPORT_APPROVED" ||
    normalizedAction === "DATA_CREATE_EMPLOYEE" ||
    normalizedAction === "DATA_IMPORT_EMPLOYEE"
  ) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function actionLabel(action: string): string {
  const normalizedAction = LEGACY_ACTION_MAPPING[action] || action;
  const found = ACTION_OPTIONS.find((item) => item.value === normalizedAction);
  return found?.label ?? action;
}

export default function AuditLogsPage() {
  const effectiveRole = useEffectiveRole();
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    actor: "",
    actionType: "all",
    ipAddress: "",
    from: "",
    to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  const queryFilters = useMemo(
    () => ({
      actor: appliedFilters.actor || undefined,
      actionType:
        appliedFilters.actionType && appliedFilters.actionType !== "all"
          ? (appliedFilters.actionType as AuditActionType)
          : undefined,
      ipAddress: appliedFilters.ipAddress || undefined,
      from: toIsoLocal(appliedFilters.from),
      to: toIsoLocal(appliedFilters.to),
      page,
      size: PAGE_SIZE,
    }),
    [appliedFilters, page],
  );

  const logsQuery = useQuery({
    queryKey: ["audit-logs", queryFilters],
    queryFn: () => auditLogService.getAuditLogs(queryFilters),
  });

  const detailQuery = useQuery({
    queryKey: ["audit-log-detail", selectedId],
    queryFn: () => {
      if (selectedId === null) {
        throw new Error("Missing audit log id");
      }
      return auditLogService.getAuditLogById(selectedId);
    },
    enabled: detailOpen && selectedId !== null,
  });

  const rows = logsQuery.data?.content ?? [];
  const totalPages = logsQuery.data?.totalPages ?? 0;
  const totalElements = logsQuery.data?.totalElements ?? 0;

  const applyFilters = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    const next = {
      actor: "",
      actionType: "all",
      ipAddress: "",
      from: "",
      to: "",
    };
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
  };

  const openDetail = (item: AuditLogItem) => {
    setSelectedId(item.id);
    setDetailOpen(true);
  };

  let listContent = (
    <TableRow>
      <TableCell colSpan={7} className="h-36 text-center text-muted-foreground">
        {SYSTEM_MESSAGES.NO_DATA}
      </TableCell>
    </TableRow>
  );

  if (logsQuery.isLoading) {
    listContent = (
      <TableRow>
        <TableCell colSpan={7} className="h-36 text-center">
          {COMMON_LOADING_TEXT}
        </TableCell>
      </TableRow>
    );
  } else if (logsQuery.isError) {
    listContent = (
      <TableRow>
        <TableCell colSpan={7} className="h-36 text-center text-destructive">
          {SYSTEM_MESSAGES.API_ERROR}
        </TableCell>
      </TableRow>
    );
  } else if (rows.length > 0) {
    listContent = (
      <>
        {rows.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatDateTime(item.createdAt)}</TableCell>
            <TableCell>{item.actor || "ANONYMOUS"}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={actionBadgeClass(item.actionType)}
              >
                {actionLabel(item.actionType)}
              </Badge>
            </TableCell>
            <TableCell>{item.ipAddress || "—"}</TableCell>
            <TableCell>{item.clientType || "—"}</TableCell>
            <TableCell>{maskIdentifier(item.identifierAttempted)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDetail(item)}
              >
                Chi tiết
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  }

  let detailContent = null;

  if (detailQuery.isLoading) {
    detailContent = (
      <div className="py-10 text-center text-sm text-muted-foreground">
        {COMMON_LOADING_TEXT}
      </div>
    );
  } else if (detailQuery.isError) {
    detailContent = (
      <div className="py-10 text-center text-sm text-destructive">
        {SYSTEM_MESSAGES.API_ERROR}
      </div>
    );
  } else if (detailQuery.data) {
    detailContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">ID</p>
          <p className="font-medium">{detailQuery.data.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Thời gian</p>
          <p className="font-medium">
            {formatDateTime(detailQuery.data.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Actor</p>
          <p className="font-medium">{detailQuery.data.actor || "ANONYMOUS"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Action</p>
          <p className="font-medium">
            {actionLabel(detailQuery.data.actionType)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">IP Address</p>
          <p className="font-medium">{detailQuery.data.ipAddress || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Client Type</p>
          <p className="font-medium">{detailQuery.data.clientType || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Identifier</p>
          <p className="font-medium">
            {maskIdentifier(detailQuery.data.identifierAttempted)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Correlation ID</p>
          <p className="font-medium break-all">
            {detailQuery.data.correlationId || "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-muted-foreground">User Agent</p>
          <p className="font-medium break-all">
            {detailQuery.data.userAgent || "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-muted-foreground">New Value</p>
          <p className="font-medium break-all">
            {detailQuery.data.newValue || "—"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
          <div className="space-y-1">
            <h1 className="page-heading">Nhật ký kiểm toán</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi ai đã thao tác gì, vào thời điểm nào và từ đâu.
            </p>
          </div>

          <div className="card-soft p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <Input
                placeholder="Actor"
                value={filters.actor}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, actor: e.target.value }))
                }
              />

              <Select
                value={filters.actionType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, actionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Loại hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả hành động</SelectItem>
                  {ACTION_OPTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="IP Address"
                value={filters.ipAddress}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, ipAddress: e.target.value }))
                }
              />

              <Input
                type="datetime-local"
                value={filters.from}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, from: e.target.value }))
                }
              />

              <Input
                type="datetime-local"
                value={filters.to}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" onClick={resetFilters}>
                {SYSTEM_MESSAGES.BTN_CANCEL}
              </Button>
              <Button onClick={applyFilters}>Lọc</Button>
            </div>
          </div>

          <div className="card-soft">
            <div className="px-4 md:px-6 py-4 border-b text-sm text-muted-foreground">
              Tổng {totalElements} bản ghi
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{listContent}</TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t">
              <span className="text-sm text-muted-foreground">
                Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={totalPages === 0 || page >= totalPages - 1}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết audit log</DialogTitle>
          </DialogHeader>

          {detailContent}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

const COMMON_LOADING_TEXT = "Đang tải dữ liệu…";
