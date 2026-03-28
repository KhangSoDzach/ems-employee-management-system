import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ShieldCheck,
  Search,
  RotateCcw,
  Filter,
  Eye,
  Clock,
  User as UserIcon,
  Activity,
  ShieldAlert,
  History
} from "lucide-react";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import { AUDIT_LOG_TEXT, COMMON_TEXT } from "@/constants/ui-texts";
import {
  AUDIT_ACTION_ENUM,
  AUDIT_ACTION_LABEL,
  AUDIT_RESOURCE_ENUM,
  AUDIT_RESOURCE_LABEL
} from "@/constants/audit-log";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  type AuditAction,
  type AuditResource,
  type AuditLogItem,
} from "@/services/auditLogService";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const RESOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: AUDIT_LOG_TEXT.ALL_RESOURCES },
  { value: AUDIT_RESOURCE_ENUM.AUTH, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.AUTH] },
  { value: AUDIT_RESOURCE_ENUM.EMPLOYEE, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.EMPLOYEE] },
  { value: AUDIT_RESOURCE_ENUM.PAYROLL, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.PAYROLL] },
  { value: AUDIT_RESOURCE_ENUM.LEAVE, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.LEAVE] },
  { value: AUDIT_RESOURCE_ENUM.ATTENDANCE, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.ATTENDANCE] },
  { value: AUDIT_RESOURCE_ENUM.ASSET, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.ASSET] },
  { value: AUDIT_RESOURCE_ENUM.SYSTEM, label: AUDIT_RESOURCE_LABEL[AUDIT_RESOURCE_ENUM.SYSTEM] },
];

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: AUDIT_LOG_TEXT.ALL_ACTIONS },
  { value: AUDIT_ACTION_ENUM.LOGIN, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.LOGIN] },
  { value: AUDIT_ACTION_ENUM.LOGIN_FAILED, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.LOGIN_FAILED] },
  { value: AUDIT_ACTION_ENUM.LOGOUT, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.LOGOUT] },
  { value: AUDIT_ACTION_ENUM.CREATE, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.CREATE] },
  { value: AUDIT_ACTION_ENUM.UPDATE, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.UPDATE] },
  { value: AUDIT_ACTION_ENUM.DELETE, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.DELETE] },
  { value: AUDIT_ACTION_ENUM.PASSWORD_CHANGE, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.PASSWORD_CHANGE] },
  { value: AUDIT_ACTION_ENUM.ACCESS_DENIED, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.ACCESS_DENIED] },
  { value: AUDIT_ACTION_ENUM.SUSPICIOUS_ACTIVITY, label: AUDIT_ACTION_LABEL[AUDIT_ACTION_ENUM.SUSPICIOUS_ACTIVITY] },
];

type FilterState = {
  actor: string;
  resource: string;
  action: string;
  ipAddress: string;
  identifier: string;
  showAnonymous: boolean;
  from: string;
  to: string;
};

const COMMON_LOADING_TEXT = COMMON_TEXT.LOADING_DATA;

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<AuditLogItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    actor: "",
    resource: "all",
    action: "all",
    ipAddress: "",
    identifier: "",
    showAnonymous: false,
    from: "",
    to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters);

  const queryFilters = useMemo(
    () => ({
      resource: appliedFilters.resource !== "all" ? appliedFilters.resource as AuditResource : undefined,
      action: appliedFilters.action !== "all" ? appliedFilters.action as AuditAction : undefined,
      actor: appliedFilters.actor || undefined,
      identifier: appliedFilters.identifier || undefined,
      ipAddress: appliedFilters.ipAddress || undefined,
      showAnonymous: appliedFilters.showAnonymous,
      from: appliedFilters.from ? `${appliedFilters.from}:00` : undefined,
      to: appliedFilters.to ? `${appliedFilters.to}:59` : undefined,
      page,
      size: PAGE_SIZE,
    }),
    [appliedFilters, page],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", queryFilters],
    queryFn: () => auditLogService.getAuditLogs(queryFilters),
  });

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const applyFilters = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    const next = {
      actor: "",
      resource: "all",
      action: "all",
      ipAddress: "",
      identifier: "",
      showAnonymous: false,
      from: "",
      to: "",
    };
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
  };

  const openDetail = (item: AuditLogItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case AUDIT_ACTION_ENUM.CREATE:
      case AUDIT_ACTION_ENUM.LOGIN:
      case "LOGIN": // legacy support
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50";
      case AUDIT_ACTION_ENUM.UPDATE:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50";
      case AUDIT_ACTION_ENUM.DELETE:
      case AUDIT_ACTION_ENUM.ACCESS_DENIED:
      case AUDIT_ACTION_ENUM.LOGIN_FAILED:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200/50";
      case AUDIT_ACTION_ENUM.SUSPICIOUS_ACTIVITY:
      case AUDIT_ACTION_ENUM.RATE_LIMIT_EXCEEDED:
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50";
    }
  };

  const formatDateTime = (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm:ss");

  return (
    <SidebarProvider>
      <AppSidebar role={effectiveRole} variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">{AUDIT_LOG_TEXT.TITLE}</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {AUDIT_LOG_TEXT.DESC}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 px-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Switch
                id="show-anon"
                checked={filters.showAnonymous}
                onCheckedChange={(checked) => {
                  setFilters(p => ({ ...p, showAnonymous: checked }));
                  // Apply immediately for UX
                  setAppliedFilters(p => ({ ...p, showAnonymous: checked }));
                  setPage(0);
                }}
              />
              <Label htmlFor="show-anon" className="text-xs font-semibold cursor-pointer select-none">
                {AUDIT_LOG_TEXT.SHOW_ANONYMOUS}
              </Label>
            </div>
          </div>

          {/* Filters Card */}
          <div className="card-glass border shadow-sm p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tác nhân (Actor)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={AUDIT_LOG_TEXT.PLACEHOLDER_ACTOR}
                    className="pl-9 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                    value={filters.actor}
                    onChange={(e) => setFilters(p => ({ ...p, actor: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tài nguyên</Label>
                <Select value={filters.resource} onValueChange={(v) => setFilters(p => ({ ...p, resource: v }))}>
                  <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hành động</Label>
                <Select value={filters.action} onValueChange={(v) => setFilters(p => ({ ...p, action: v }))}>
                  <SelectTrigger className="bg-slate-50/50 dark:bg-slate-950/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Định danh (Identifier)</Label>
                <Input
                  placeholder={AUDIT_LOG_TEXT.PLACEHOLDER_IDENTIFIER}
                  className="bg-slate-50/50 dark:bg-slate-950/50"
                  value={filters.identifier}
                  onChange={(e) => setFilters(p => ({ ...p, identifier: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{AUDIT_LOG_TEXT.LABEL_IP}</Label>
                <Input
                  placeholder={AUDIT_LOG_TEXT.PLACEHOLDER_IP}
                  className="bg-slate-50/50 dark:bg-slate-950/50"
                  value={filters.ipAddress}
                  onChange={(e) => setFilters(p => ({ ...p, ipAddress: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Từ thời điểm</Label>
                <Input
                  type="datetime-local"
                  className="bg-slate-50/50 dark:bg-slate-950/50"
                  value={filters.from}
                  onChange={(e) => setFilters(p => ({ ...p, from: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Đến thời điểm</Label>
                <Input
                  type="datetime-local"
                  className="bg-slate-50/50 dark:bg-slate-950/50"
                  value={filters.to}
                  onChange={(e) => setFilters(p => ({ ...p, to: e.target.value }))}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button variant="ghost" className="flex-1 text-slate-500" onClick={resetFilters}>
                  <RotateCcw className="w-4 h-4 mr-2" /> {SYSTEM_MESSAGES.BTN_CANCEL}
                </Button>
                <Button className="flex-1 shadow-lg shadow-primary/20" onClick={applyFilters}>
                  <Filter className="w-4 h-4 mr-2" /> {SYSTEM_MESSAGES.FILTER}
                </Button>
              </div>
            </div>
          </div>
        </div>

          {/* Table Card */}
          <div className="card-glass border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-widest text-slate-500">{AUDIT_LOG_TEXT.TAB_DATA}</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">{COMMON_TEXT.TOTAL}: {totalElements}</Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50/50">
                    <TableHead className="w-[180px]">{AUDIT_LOG_TEXT.LABEL_TIME}</TableHead>
                    <TableHead>{AUDIT_LOG_TEXT.LABEL_ACTOR}</TableHead>
                    <TableHead>{AUDIT_LOG_TEXT.LABEL_ACTION}</TableHead>
                    <TableHead>{AUDIT_LOG_TEXT.LABEL_RESOURCE}</TableHead>
                    <TableHead>{AUDIT_LOG_TEXT.LABEL_IDENTIFIER}</TableHead>
                    <TableHead>{AUDIT_LOG_TEXT.LABEL_IP}</TableHead>
                    <TableHead className="text-right">{AUDIT_LOG_TEXT.LABEL_ACTION}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="h-64 text-center text-slate-400 italic animate-pulse">{COMMON_LOADING_TEXT}</TableCell></TableRow>
                  ) : isError ? (
                    <TableRow><TableCell colSpan={7} className="h-64 text-center text-red-500 font-medium">{COMMON_TEXT.ERROR_CONNECTING}</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-64 text-center text-slate-400 italic">{COMMON_TEXT.NO_DATA_FOUND}</TableCell></TableRow>
                  ) : (
                    rows.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => openDetail(item)}>
                        <TableCell className="font-mono text-[11px] text-slate-500">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.actor === "ANONYMOUS" ? (
                            <span className="text-slate-400 italic flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5" /> {AUDIT_LOG_TEXT.ANONYMOUS}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-primary" /> {item.actor}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("px-2 py-0 border-0 shadow-none font-bold text-[10px] uppercase tracking-tighter", getActionBadge(item.action))}>
                            {item.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.resource}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 font-medium">
                          {item.identifier || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-slate-400">
                          {item.ipAddress || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800 transition-all">
              <span className="text-xs font-semibold text-slate-500">
                {COMMON_TEXT.PAGE} {totalPages === 0 ? 0 : page + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-wider"
                  disabled={page <= 0}
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                >
                  {COMMON_TEXT.PREVIOUS}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-8 text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-slate-900 shadow-sm"
                  disabled={totalPages === 0 || page >= totalPages - 1}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  {COMMON_TEXT.NEXT}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">{AUDIT_LOG_TEXT.DETAIL_TITLE}</DialogTitle>
            </div>
            <p className="text-slate-400 text-sm mt-1 font-mono">{selectedItem?.correlationId}</p>
          </DialogHeader>

          {selectedItem && (
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_TIME}</Label>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <p className="font-semibold">{formatDateTime(selectedItem.createdAt)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.TAB_DATA}</Label>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Badge variant="outline" className="font-bold border-primary/50 text-primary">{selectedItem.category}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_DETAIL_IP}</Label>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <p className="font-mono font-bold text-primary">{selectedItem.ipAddress || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.SECTION_ACTOR}</Label>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedItem.actor || AUDIT_LOG_TEXT.ANONYMOUS}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_BROWSER}</Label>
                    <p className="text-sm font-medium">{selectedItem.clientType} / {selectedItem.userAgent}</p>
                  </div>
                </div>
                <div className="space-y-4 border-l md:pl-8 border-slate-200 dark:border-slate-800">
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_TARGET_NAME}</Label>
                    <p className="text-lg font-bold text-primary">{selectedItem.target?.name || selectedItem.identifier || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_TARGET_ID}</Label>
                      <p className="font-mono text-xs text-slate-500">{selectedItem.target?.id || selectedItem.targetId || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-slate-400">{AUDIT_LOG_TEXT.LABEL_TARGET_TYPE}</Label>
                      <p className="font-mono text-xs text-slate-500">{selectedItem.target?.type || selectedItem.resource || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full w-2 h-2 p-0 bg-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">{AUDIT_LOG_TEXT.SECTION_VALUES}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">{AUDIT_LOG_TEXT.LABEL_OLD_VALUE}</Label>
                    <pre className="text-xs font-mono text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                      {selectedItem.oldValue || "—"}
                    </pre>
                  </div>
                  <div className="space-y-2 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl">
                    <Label className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">{AUDIT_LOG_TEXT.LABEL_NEW_VALUE}</Label>
                    <pre className="text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedItem.newValue || "—"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 border-t dark:border-slate-800">
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="font-bold">{COMMON_TEXT.CLOSE}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
