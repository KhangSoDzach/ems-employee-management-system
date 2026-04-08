import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

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
  {
    value: "LOGIN_SUCCESS",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.LOGIN_SUCCESS,
  },
  {
    value: "LOGIN_FAILED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.LOGIN_FAILED,
  },
  {
    value: "PASSWORD_CHANGED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.PASSWORD_CHANGED,
  },
  {
    value: "TOKEN_REFRESH_SUCCESS",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.TOKEN_REFRESH_SUCCESS,
  },
  {
    value: "TOKEN_REFRESH_FAILED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.TOKEN_REFRESH_FAILED,
  },
  {
    value: "TOKEN_EXPIRED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.TOKEN_EXPIRED,
  },
  {
    value: "TOKEN_INVALID",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.TOKEN_INVALID,
  },
  {
    value: "TOKEN_REVOKED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.TOKEN_REVOKED,
  },
  { value: "LOGOUT", label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.LOGOUT },
  {
    value: "ACCESS_DENIED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.ACCESS_DENIED,
  },
  {
    value: "ASSET_REPORT_SUBMITTED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.ASSET_REPORT_SUBMITTED,
  },
  {
    value: "ASSET_REPORT_APPROVED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.ASSET_REPORT_APPROVED,
  },
  {
    value: "ASSET_REPORT_REJECTED",
    label: SYSTEM_MESSAGES.AUDIT_LOGS.ACTION_OPTIONS.ASSET_REPORT_REJECTED,
  },
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

/**
 * AuditLogsPage Component
 * Provides a comprehensive audit trail of system activities for security and transparency.
 *
 * Capabilities:
 * - Activity Monitoring: Track login success/failure, profile changes, and sensitive operations.
 * - Advanced Filtering: Filter logs by actor, action type, IP address, and date range.
 * - Detailed Inspection: View full metadata for each audit entry, including user-agent and correlation IDs.
 * - Security Analytics: Identify potential security breaches or suspicious patterns.
 */
export default function AuditLogsPage() {
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
                {SYSTEM_MESSAGES.AUDIT_LOGS.BTN_DETAIL}
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
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_ID}
          </p>
          <p className="font-medium">{detailQuery.data.id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_TIME}
          </p>
          <p className="font-medium">
            {formatDateTime(detailQuery.data.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_ACTOR}
          </p>
          <p className="font-medium">{detailQuery.data.actor || "ANONYMOUS"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_ACTION}
          </p>
          <p className="font-medium">
            {actionLabel(detailQuery.data.actionType)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_IP}
          </p>
          <p className="font-medium">{detailQuery.data.ipAddress || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_CLIENT_TYPE}
          </p>
          <p className="font-medium">{detailQuery.data.clientType || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_IDENTIFIER}
          </p>
          <p className="font-medium">
            {maskIdentifier(detailQuery.data.identifierAttempted)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_CORRELATION_ID}
          </p>
          <p className="font-medium break-all">
            {detailQuery.data.correlationId || "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_USER_AGENT}
          </p>
          <p className="font-medium break-all">
            {detailQuery.data.userAgent || "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_NEW_VALUE}
          </p>
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
          <h1 className="page-heading">{SYSTEM_MESSAGES.AUDIT_LOGS.TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.DESC}
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
                <SelectValue
                  placeholder={
                    SYSTEM_MESSAGES.AUDIT_LOGS.PLACEHOLDER_ACTION_TYPE
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {SYSTEM_MESSAGES.AUDIT_LOGS.OPTION_ALL_ACTIONS}
                </SelectItem>
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
            <Button onClick={applyFilters}>
              {SYSTEM_MESSAGES.AUDIT_LOGS.BTN_FILTER}
            </Button>
          </div>
        </div>

        <div className="card-soft">
          <div className="px-4 md:px-6 py-4 border-b text-sm text-muted-foreground">
            {SYSTEM_MESSAGES.AUDIT_LOGS.TOTAL_REC} {totalElements}{" "}
            {SYSTEM_MESSAGES.AUDIT_LOGS.REC_UNIT}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_TIME}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_ACTOR}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.AUDIT_LOGS.TABLE_ACTION}</TableHead>
                <TableHead>{SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_IP}</TableHead>
                <TableHead>
                  {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_CLIENT_TYPE}
                </TableHead>
                <TableHead>
                  {SYSTEM_MESSAGES.AUDIT_LOGS.LABEL_IDENTIFIER}
                </TableHead>
                <TableHead className="text-right">
                  {SYSTEM_MESSAGES.LABEL_ACTION}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{listContent}</TableBody>
          </Table>

          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t">
            <span className="text-sm text-muted-foreground">
              {SYSTEM_MESSAGES.AUDIT_LOGS.PAGE_PREFIX}{" "}
              {totalPages === 0 ? 0 : page + 1}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              >
                {SYSTEM_MESSAGES.AUDIT_LOGS.BTN_PREV}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={totalPages === 0 || page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                {SYSTEM_MESSAGES.AUDIT_LOGS.BTN_NEXT}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {SYSTEM_MESSAGES.AUDIT_LOGS.MODAL_DETAIL_TITLE}
            </DialogTitle>
          </DialogHeader>

          {detailContent}
        </DialogContent>
      </Dialog>
    </>
  );
}

const COMMON_LOADING_TEXT = SYSTEM_MESSAGES.LOADING;
