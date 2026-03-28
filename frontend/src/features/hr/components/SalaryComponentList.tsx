import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type SalaryComponentPayload,
  type SalaryComponentResponse,
} from "@/services/salaryComponentApi";
import {
  useCreateSalaryComponent,
  useSalaryComponents,
  useUpdateSalaryComponent,
} from "@/features/hr/hooks/useSalaryComponents";
import { SalaryComponentForm } from "@/features/hr/components/SalaryComponentForm";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { PAYROLL_ADMIN_CONSTANTS as C } from "@/features/admin/salary-policy.constants";

// ── Types ──────────────────────────────────────────────────────────────────────

type ModalState = {
  open: boolean;
  mode: "create" | "edit";
  selected: SalaryComponentResponse | null;
};

const INITIAL_MODAL_STATE: ModalState = {
  open: false,
  mode: "create",
  selected: null,
};

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

// ── Helpers ────────────────────────────────────────────────────────────────────

function getApiErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return C.ERROR_FALLBACK;
  }
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e.response?.data?.message ?? e.message ?? C.ERROR_FALLBACK;
}

// ── 403 Guard ──────────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldAlert className="h-14 w-14 text-destructive opacity-80" />
      <h2 className="text-xl font-bold text-destructive">
        {C.ACCESS_DENIED_TITLE}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {C.ACCESS_DENIED_DESC}
      </p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SalaryComponentList() {
  const effectiveRole = useEffectiveRole();

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE);
  const [serverError, setServerError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const salaryComponentsQuery = useSalaryComponents();
  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();

  const filteredRows = useMemo(() => {
    const raw = salaryComponentsQuery.data ?? [];
    if (!search.trim()) {
      return raw;
    }
    const q = search.trim().toLowerCase();
    return raw.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  }, [salaryComponentsQuery.data, search]);

  const totalElements = filteredRows.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const paginatedRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const closeModal = () => {
    setModal(INITIAL_MODAL_STATE);
    setServerError(null);
  };

  const openCreate = () => {
    setModal({ open: true, mode: "create", selected: null });
    setServerError(null);
  };

  const openEdit = (row: SalaryComponentResponse) => {
    setModal({ open: true, mode: "edit", selected: row });
    setServerError(null);
  };

  const handleSubmit = (payload: SalaryComponentPayload) => {
    setServerError(null);

    if (modal.mode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(C.TOAST_CREATE_SUCCESS);
          closeModal();
        },
        onError: (error) => {
          const message = getApiErrorMessage(error);
          setServerError(message);
          toast.error(message);
        },
      });
      return;
    }

    if (!modal.selected) {
      return;
    }

    updateMutation.mutate(
      { id: modal.selected.id, payload },
      {
        onSuccess: () => {
          toast.success(C.TOAST_UPDATE_SUCCESS);
          closeModal();
        },
        onError: (error) => {
          const message = getApiErrorMessage(error);
          setServerError(message);
          toast.error(message);
        },
      },
    );
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background min-h-screen">
        {/* ── RBAC guard ── */}
        {effectiveRole !== "admin" ? (
          <AccessDenied />
        ) : (
          <>
            {/* ── Page Header ── */}
            <div className="payroll-page-header">
              <div>
                <h1 className="page-heading">{C.PAGE_TITLE}</h1>
                <p className="text-sm text-muted-foreground">
                  {C.PAGE_SUBTITLE}
                </p>
              </div>
              <div className="payroll-header-actions">
                <Button
                  onClick={openCreate}
                  className="gap-2 shadow-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  {C.BTN_CREATE}
                </Button>
              </div>
            </div>

            {/* ── Search ── */}
            <div className="payroll-search-wrapper">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={C.SEARCH_PLACEHOLDER}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9 h-10 w-full text-sm border-slate-200 focus:border-primary focus:ring-primary shadow-sm"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Data Table ── */}
            <section className="payroll-table-section">
              <div className="card-soft overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{C.COL_CODE}</TableHead>
                      <TableHead>{C.COL_NAME}</TableHead>
                      <TableHead>{C.COL_TYPE}</TableHead>
                      <TableHead>{C.COL_TAXABLE}</TableHead>
                      <TableHead>{C.COL_INSURABLE}</TableHead>
                      <TableHead>{C.COL_NATURE}</TableHead>
                      <TableHead>{C.COL_AMOUNT}</TableHead>
                      <TableHead>{C.COL_RATE}</TableHead>
                      <TableHead>{C.COL_STATUS}</TableHead>
                      <TableHead className="text-right">
                        {C.COL_ACTIONS}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {salaryComponentsQuery.isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-sm text-muted-foreground"
                        >
                          {C.LOADING}
                        </TableCell>
                      </TableRow>
                    ) : paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center text-sm text-muted-foreground py-10"
                        >
                          {search ? C.EMPTY_SEARCH : C.EMPTY_DATA}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.code}
                          </TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            {C.TYPE_LABELS[row.type] ?? row.type}
                          </TableCell>
                          <TableCell>{row.isTaxable ? C.YES : C.NO}</TableCell>
                          <TableCell>
                            {row.isInsurable ? C.YES : C.NO}
                          </TableCell>
                          <TableCell>
                            {C.NATURE_LABELS[row.nature] ?? row.nature}
                          </TableCell>
                          <TableCell>
                            {row.amount === null || row.amount === undefined
                              ? C.EMPTY_VALUE
                              : Number(row.amount).toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell>
                            {row.ratePercent === null ||
                            row.ratePercent === undefined
                              ? C.EMPTY_VALUE
                              : `${Number(row.ratePercent).toLocaleString("vi-VN")}%`}
                          </TableCell>
                          <TableCell>
                            {C.STATUS_LABELS[row.status] ?? row.status}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(row)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ── Pagination ── */}
              <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/50 dark:bg-transparent">
                <div className="text-sm text-muted-foreground">
                  {C.PAGINATION_TOTAL(totalElements)}{" "}
                  {totalPages === 0 ? 0 : page + 1}/{totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="gap-1 h-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {C.PAGINATION_PREV}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || totalPages === 0}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1 h-9"
                  >
                    {C.PAGINATION_NEXT}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <SalaryComponentForm
        open={modal.open}
        mode={modal.mode}
        initialValue={modal.selected}
        submitting={isSubmitting}
        serverError={serverError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
