import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SYSTEM_MESSAGES } from "@/constants/messages";
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

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

const ACTION_OPTIONS: Array<{ value: AuditActionType; label: string }> = [
  { value: "LOGIN_SUCCESS", label: "Đăng nhập thành công" },
  { value: "LOGIN_FAILED", label: "Đăng nhập thất bại" },
  { value: "PASSWORD_CHANGED", label: "Đổi mật khẩu" },
  { value: "TOKEN_REFRESH_SUCCESS", label: "Làm mới token thành công" },
  { value: "TOKEN_REFRESH_FAILED", label: "Làm mới token thất bại" },
  { value: "TOKEN_EXPIRED", label: "Token hết hạn" },
  { value: "TOKEN_INVALID", label: "Token không hợp lệ" },
  { value: "TOKEN_REVOKED", label: "Thu hồi token" },
  { value: "LOGOUT", label: "Đăng xuất" },
  { value: "ACCESS_DENIED", label: "Từ chối truy cập" },
  { value: "ASSET_REPORT_SUBMITTED", label: "Gửi báo cáo sự cố" },
  { value: "ASSET_REPORT_APPROVED", label: "Duyệt báo cáo sự cố" },
  { value: "ASSET_REPORT_REJECTED", label: "Từ chối báo cáo sự cố" },
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
    const parts = identifier.split("@");
    const left = parts[0] || "";
    const right = parts.length > 1 ? parts.slice(1).join("@") : "";

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

function actionBadgeClass(action: AuditActionType): string {
  if (action.includes("FAILED") || action === "ACCESS_DENIED") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (action.includes("SUCCESS") || action === "PASSWORD_CHANGED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function actionLabel(action: AuditActionType): string {
  const found = ACTION_OPTIONS.find((item) => item.value === action);
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
    <>
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
