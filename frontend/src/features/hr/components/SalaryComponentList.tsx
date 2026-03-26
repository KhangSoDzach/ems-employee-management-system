import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

export function SalaryComponentList() {
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL_STATE);
  const [serverError, setServerError] = useState<string | null>(null);

  const salaryComponentsQuery = useSalaryComponents();
  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();

  const rows = useMemo(
    () => salaryComponentsQuery.data ?? [],
    [salaryComponentsQuery.data],
  );

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
        <main className="min-h-screen space-y-8 bg-background p-4 pt-6 md:p-8">
          <RunPayrollPanel />

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="page-heading">Cấu hình chính sách lương</h1>
                <p className="text-sm text-muted-foreground">
                  Quản lý danh sách thành phần lương để phục vụ hệ thống tính
                  lương.
                </p>
              </div>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo mới
              </Button>
            </div>

            <section className="rounded-lg border bg-white shadow-sm dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại</TableHead>
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
                        colSpan={8}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Đang tải dữ liệu...
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
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                          {SALARY_COMPONENT_TYPE_LABELS[row.type] ?? row.type}
                        </TableCell>
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
                          {row.ratePercent === null || row.ratePercent === undefined
                            ? "-"
                            : `${Number(row.ratePercent).toLocaleString("vi-VN")}%`}
                        </TableCell>
                        <TableCell>
                          {SALARY_COMPONENT_STATUS_LABELS[row.status] ??
                            row.status}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(row)}
                            aria-label={`Chỉnh sửa ${row.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
          </div>
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
