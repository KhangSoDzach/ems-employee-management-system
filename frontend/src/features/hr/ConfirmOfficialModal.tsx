import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  EmployeeResponse,
  OfficialContractRequest,
} from "@/services/employeeService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { useConvertToOfficial } from "./hooks/useEmployeeLifecycle";
import { EMPLOYEE_CONSTANTS } from "../../constants/employee.constants";

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
    const suggestedSalary =
      baseline > 0
        ? Math.round(
            baseline * EMPLOYEE_CONSTANTS.VALIDATION.SUGGESTED_INCREASE_RATE,
          )
        : 0;

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
      toast.success(SYSTEM_MESSAGES.EMPLOYEE.MSG_CONVERT_SUCCESS);
      onSuccess();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        SYSTEM_MESSAGES.EMPLOYEE.MSG_CONVERT_ERROR;
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {SYSTEM_MESSAGES.EMPLOYEE.MODAL_CONVERT_TITLE}
            </h3>
            <p className="text-sm text-muted-foreground">
              {employee.firstName} {employee.lastName} • {employee.employeeCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="official-contract-start-date"
              className="text-xs font-semibold text-muted-foreground uppercase"
            >
              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_SIGNING_DATE}
            </label>
            <input
              id="official-contract-start-date"
              type="date"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card"
              {...register("contractStartDate", {
                required: SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_SIGNING_DATE,
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
              className="text-xs font-semibold text-muted-foreground uppercase"
            >
              {SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPE_OFFICIAL}
            </label>
            <select
              id="official-contract-term"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card"
              {...register("contractTerm", { required: true })}
            >
              <option value="ONE_YEAR">
                {SYSTEM_MESSAGES.EMPLOYEE.TERM_ONE_YEAR}
              </option>
              <option value="TWO_YEARS">
                {SYSTEM_MESSAGES.EMPLOYEE.TERM_TWO_YEARS}
              </option>
              <option value="THREE_YEARS">
                {SYSTEM_MESSAGES.EMPLOYEE.TERM_THREE_YEARS}
              </option>
              <option value="INDEFINITE">
                {SYSTEM_MESSAGES.EMPLOYEE.TERM_INDEFINITE}
              </option>
            </select>
            {contractTerm !== "INDEFINITE" && (
              <p className="text-xs text-amber-600">
                {SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TERM_AUTO}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="official-salary"
              className="text-xs font-semibold text-muted-foreground uppercase"
            >
              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_OFFICIAL_SALARY_VND}
            </label>
            <input
              id="official-salary"
              type="number"
              min={EMPLOYEE_CONSTANTS.VALIDATION.MIN_OFFICIAL_SALARY}
              step={EMPLOYEE_CONSTANTS.VALIDATION.SALARY_STEP}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card"
              {...register("officialSalary", {
                required: SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_OFFICIAL_SALARY,
                valueAsNumber: true,
                min: {
                  value: EMPLOYEE_CONSTANTS.VALIDATION.MIN_OFFICIAL_SALARY,
                  message: SYSTEM_MESSAGES.EMPLOYEE.MSG_SALARY_MIN,
                },
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
              className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted"
              disabled={convertMutation.isPending}
            >
              {SYSTEM_MESSAGES.BTN_CANCEL}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/20 transition-all active:scale-95"
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {SYSTEM_MESSAGES.SAVING}
                </span>
              ) : (
                SYSTEM_MESSAGES.EMPLOYEE.BTN_CONFIRM_OFFICIAL
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
