import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  EmployeeResponse,
  OfficialContractRequest,
} from "@/services/employeeService";
import { useConvertToOfficial } from "./hooks/useEmployeeLifecycle";

type ContractTerm = OfficialContractRequest["contractTerm"];

type FormValues = {
  contractStartDate: string;
  contractTerm: ContractTerm;
  officialSalary: number;
};

interface Props {
  open: boolean;
  employee: EmployeeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmOfficialModal({
  open,
  employee,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const convertMutation = useConvertToOfficial();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      contractStartDate: new Date().toISOString().slice(0, 10),
      contractTerm: "ONE_YEAR",
      officialSalary: 0,
    },
  });

  useEffect(() => {
    if (!open || !employee) {
      return;
    }

    const baseline = employee.probationSalary ?? employee.salary ?? 0;
    const suggestedSalary = baseline > 0 ? Math.round(baseline * 1.1) : 0;

    reset({
      contractStartDate: new Date().toISOString().slice(0, 10),
      contractTerm: "ONE_YEAR",
      officialSalary: suggestedSalary,
    });
  }, [open, employee, reset]);

  const contractTerm = watch("contractTerm");

  if (!open || !employee) {
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await convertMutation.mutateAsync({
        employeeId: employee.id,
        payload: {
          contractStartDate: values.contractStartDate,
          contractTerm: values.contractTerm,
          officialSalary: Number(values.officialSalary),
        },
      });
      toast.success("Xác nhận chính thức thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Không thể xác nhận chính thức. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Xác nhận chính thức
            </h3>
            <p className="text-sm text-gray-500">
              {employee.firstName} {employee.lastName} • {employee.employeeCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="official-contract-start-date"
              className="text-xs font-semibold text-gray-500 uppercase"
            >
              Ngày ký HĐ chính thức
            </label>
            <input
              id="official-contract-start-date"
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              {...register("contractStartDate", {
                required: "Vui lòng chọn ngày ký hợp đồng",
              })}
            />
            {errors.contractStartDate && (
              <p className="text-xs text-red-500">
                {errors.contractStartDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="official-contract-term"
              className="text-xs font-semibold text-gray-500 uppercase"
            >
              Loại hợp đồng chính thức
            </label>
            <select
              id="official-contract-term"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              {...register("contractTerm", { required: true })}
            >
              <option value="ONE_YEAR">1 năm</option>
              <option value="TWO_YEARS">2 năm</option>
              <option value="THREE_YEARS">3 năm</option>
              <option value="INDEFINITE">Không thời hạn</option>
            </select>
            {contractTerm !== "INDEFINITE" && (
              <p className="text-xs text-amber-600">
                Hệ thống sẽ tự tính ngày hết hạn hợp đồng theo kỳ hạn đã chọn.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="official-salary"
              className="text-xs font-semibold text-gray-500 uppercase"
            >
              Mức lương chính thức mới (VNĐ)
            </label>
            <input
              id="official-salary"
              type="number"
              min={1}
              step="1000"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              {...register("officialSalary", {
                required: "Vui lòng nhập mức lương chính thức",
                valueAsNumber: true,
                min: { value: 1, message: "Mức lương phải lớn hơn 0" },
              })}
            />
            {errors.officialSalary && (
              <p className="text-xs text-red-500">
                {errors.officialSalary.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              disabled={convertMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                "Xác nhận chính thức"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
