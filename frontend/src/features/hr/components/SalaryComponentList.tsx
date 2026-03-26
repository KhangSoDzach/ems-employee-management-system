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
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { RunPayrollPanel } from "@/features/hr/components/RunPayrollPanel";

// ── Constants ─────────────────────────────────────────────────────────────────

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

const SALARY_COMPONENT_TYPE_LABELS: Record<string, string> = {
  BASE: "Lương cơ bản",
  ALLOWANCE: "Phụ cấp",
  COMMISSION: "Hoa hồng",
  BONUS: "Thưởng",
  DEDUCTION: "Khấu trừ",
  INSURANCE: "Bảo hiểm",
};

const SALARY_COMPONENT_NATURE_LABELS: Record<string, string> = {
  INCOME: "Thu nhập",
  DEDUCTION: "Khấu trừ",
};

const SALARY_COMPONENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang áp dụng",
  INACTIVE: "Ngừng áp dụng",
};

const PAGE_SIZE = SYSTEM_MESSAGES.COMMON.DEFAULT_PAGE_SIZE;

function getApiErrorMessage(error: unknown): string {
  const fallback = "Không thể xử lý yêu cầu. Vui lòng thử lại.";
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

// ── Component ─────────────────────────────────────────────────────────────────

export function SalaryComponentList() {
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
          toast.success("Tạo thành phần lương thành công");
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
          toast.success("Cập nhật thành phần lương thành công");
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
    <SidebarProvider>
      <AppSidebar role="admin" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {/*
         * ⚠️  RunPayrollPanel PHẢI nằm bên trong SidebarInset
         *    để sidebar không đè lên nội dung.
         *    KHÔNG đặt nó ở PayrollManagement.tsx bên ngoài component này.
         */}
        {/* No min-h-screen: flex column fills viewport, no page scroll */}
        <main className="min-h-screen space-y-6 bg-background p-4 pt-6 md:p-8">

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mã hoặc tên..."
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <section className="rounded-lg border bg-white shadow-sm dark:bg-slate-900 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Chịu thuế</TableHead>
                  <TableHead>Đóng BHXH</TableHead>
                  <TableHead>Tính chất</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Hệ số (%)</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {salaryComponentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      {search
                        ? "Không tìm thấy kết quả phù hợp."
                        : "Chưa có thành phần lương nào."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        {SALARY_COMPONENT_TYPE_LABELS[row.type] ?? row.type}
                      </TableCell>
                      <TableCell>{row.isTaxable ? "Có" : "Không"}</TableCell>
                      <TableCell>{row.isInsurable ? "Có" : "Không"}</TableCell>
                      <TableCell>
                        {SALARY_COMPONENT_NATURE_LABELS[row.nature] ??
                          row.nature}
                      </TableCell>
                      <TableCell>
                        {row.amount === null || row.amount === undefined
                          ? "-"
                          : Number(row.amount).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        {row.ratePercent === null ||
                        row.ratePercent === undefined
                          ? "-"
                          : `${Number(row.ratePercent).toLocaleString("vi-VN")}%`}
                      </TableCell>
                      <TableCell>
                        {SALARY_COMPONENT_STATUS_LABELS[row.status] ??
                          row.status}
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Chưa có thành phần lương nào.
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/50 dark:bg-transparent">
              <div className="text-sm text-muted-foreground">
                Tổng cộng {totalElements} kết quả. Trang{" "}
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
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1 || totalPages === 0}
                  onClick={() => setPage((p) => p + 1)}
                  className="gap-1 h-9"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
