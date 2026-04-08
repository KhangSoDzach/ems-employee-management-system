import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PAYROLL_ADMIN_CONSTANTS } from "../../constants/payroll.constants";
import { useEffectiveRole, EFFECTIVE_ROLES } from "@/hooks/useEffectiveRole";
import { ForbiddenPage } from "../security/ForbiddenPage";
import { SYSTEM_MESSAGES } from "@/constants/messages";

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

const SALARY_COMPONENT_TYPE_LABELS: Record<string, string> =
  PAYROLL_ADMIN_CONSTANTS.TYPE_LABELS;

const SALARY_COMPONENT_NATURE_LABELS: Record<string, string> =
  PAYROLL_ADMIN_CONSTANTS.NATURE_LABELS;

const SALARY_COMPONENT_STATUS_LABELS: Record<string, string> =
  PAYROLL_ADMIN_CONSTANTS.STATUS_LABELS;

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

function getApiErrorMessage(error: unknown): string {
  const fallback = SYSTEM_MESSAGES.SALARY_COMPONENT.MSG_PROCESS_ERROR;
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };
  return (
    maybeAxiosError.response?.data?.message ??
    maybeAxiosError.message ??
    fallback
  );
}

/**
 * SalaryComponentPage Component
 * Provides a specialized interface for administrators to configure the company's salary structure.
 *
 * Capabilities:
 * - Define Base Salary, Allowances, Bonuses, and Deductions.
 * - Configure Taxable and Insurable flags for each component.
 * - Set fixed Amounts or Percentage Rates.
 * - Search and Paginate through the component library.
 */
export default function SalaryComponentPage() {
  const role = useEffectiveRole();
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

  // RBAC check: Requires Administrative privileges
  if (role !== EFFECTIVE_ROLES.ADMIN) {
    return <ForbiddenPage />;
  }

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
          toast.success(PAYROLL_ADMIN_CONSTANTS.MESSAGES.CREATE_SUCCESS);
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
          toast.success(PAYROLL_ADMIN_CONSTANTS.MESSAGES.UPDATE_SUCCESS);
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
    <main className="page-layout-wrapper">
      <div className="page-header-container">
        <div>
          <h1 className="page-heading">{PAYROLL_ADMIN_CONSTANTS.TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {PAYROLL_ADMIN_CONSTANTS.SUBTITLE}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm font-medium">
          <Plus className="h-4 w-4" />
          {PAYROLL_ADMIN_CONSTANTS.BTN_CREATE}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-6">
        <div className="search-input-wrapper">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={PAYROLL_ADMIN_CONSTANTS.SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 h-10 w-full text-sm shadow-sm"
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

      <div className="data-table-container">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.CODE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.NAME}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.TYPE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.TAXABLE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.INSURABLE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.NATURE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.AMOUNT}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.RATE}</TableHead>
                <TableHead>{PAYROLL_ADMIN_CONSTANTS.TABLE.STATUS}</TableHead>
                <TableHead className="text-right">
                  {PAYROLL_ADMIN_CONSTANTS.TABLE.ACTIONS}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {salaryComponentsQuery.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {PAYROLL_ADMIN_CONSTANTS.MESSAGES.LOADING}
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {search
                      ? PAYROLL_ADMIN_CONSTANTS.MESSAGES.NOT_FOUND
                      : PAYROLL_ADMIN_CONSTANTS.MESSAGES.EMPTY}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {SALARY_COMPONENT_TYPE_LABELS[row.type] ?? row.type}
                    </TableCell>
                    <TableCell>
                      {row.isTaxable
                        ? SYSTEM_MESSAGES.COMMON.YES
                        : SYSTEM_MESSAGES.COMMON.NO}
                    </TableCell>
                    <TableCell>
                      {row.isInsurable
                        ? SYSTEM_MESSAGES.COMMON.YES
                        : SYSTEM_MESSAGES.COMMON.NO}
                    </TableCell>
                    <TableCell>
                      {SALARY_COMPONENT_NATURE_LABELS[row.nature] ?? row.nature}
                    </TableCell>
                    <TableCell>
                      {row.amount === null || row.amount === undefined
                        ? "-"
                        : Number(row.amount).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {row.ratePercent === null || row.ratePercent === undefined
                        ? "-"
                        : `${Number(row.ratePercent).toLocaleString("vi-VN")}%`}
                    </TableCell>
                    <TableCell>
                      {SALARY_COMPONENT_STATUS_LABELS[row.status] ?? row.status}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        className="h-8 w-8 hover:text-primary"
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

        <div className="px-5 py-3 border-t bg-muted/20 flex items-center justify-between text-sm text-muted-foreground">
          <div className="text-sm font-medium text-muted-foreground">
            {SYSTEM_MESSAGES.COMMON.TOTAL} {totalElements}{" "}
            {SYSTEM_MESSAGES.COMMON.RESULT}. {SYSTEM_MESSAGES.COMMON.PAGE}{" "}
            {totalPages === 0 ? 0 : page + 1}/{totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 gap-1 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" /> {SYSTEM_MESSAGES.COMMON.PREV}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 gap-1 rounded-lg"
            >
              {SYSTEM_MESSAGES.COMMON.NEXT} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SalaryComponentForm
        open={modal.open}
        mode={modal.mode}
        initialValue={modal.selected}
        submitting={isSubmitting}
        serverError={serverError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
