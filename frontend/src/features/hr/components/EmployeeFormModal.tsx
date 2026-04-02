import { useState, useEffect } from "react";
import { X, Save, User, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  employeeService,
  EmployeeRequest,
  EmployeeResponse,
} from "@/services/employeeService";
import {
  lookupService,
  DepartmentOption,
  PositionOption,
  ManagerOption,
  MANAGER_LEVEL,
} from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { EMPLOYEE_CONSTANTS } from "../employee.constants";
import EmployeeFormFields from "./EmployeeFormFields";
import { employeeSchema, EmployeeFormValues } from "../schemas/employee.schema";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  employeeId?: number | null;
  employee?: EmployeeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      fieldErrors?: Record<string, string>;
    };
  };
}

const INITIAL_FORM_STATE: Partial<EmployeeFormValues> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  hireDate: new Date().toISOString().slice(0, 10),
  departmentId: 0,
  positionId: 0,
  salary: 0,
  gender: "MALE",
  workStatus: "PROBATION",
  contractType: "FULL_TIME",
  nationality: EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY,
  address: "",
  city: "",
  nationalId: "",
  socialSecurityNumber: "",
};

export default function EmployeeFormModal(props: Readonly<Props>) {
  const { open, mode, employeeId, employee, onClose, onSuccess } = props;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const methods = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: INITIAL_FORM_STATE as EmployeeFormValues,
    mode: "onBlur",
  });

  const { handleSubmit, reset, watch, setValue, setError } = methods;

  const departmentId = watch("departmentId");
  const positionId = watch("positionId");
  const avatarUrl = watch("avatarUrl");

  const normalizeValidationMessage = (message: string): string => {
    const parts = message
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const detail = parts[1] ?? message;
      const hint = parts[2];
      return hint ? `${detail} (${hint})` : detail;
    }
    return message;
  };

  const applyServerValidationErrors = (error: unknown): boolean => {
    const fieldErrors = (error as ApiError)?.response?.data?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as any, {
          type: "server",
          message: normalizeValidationMessage(message),
        });
      });
      const firstFieldError = Object.values(fieldErrors)[0];
      if (firstFieldError) {
        toast.error(normalizeValidationMessage(firstFieldError));
      }
      return true;
    }
    return false;
  };

  const selectedPosition = positions.find((p) => p.id === positionId);
  const isManagerPosition = selectedPosition
    ? selectedPosition.level >= MANAGER_LEVEL
    : false;

  // Load common lookups
  useEffect(() => {
    if (open) {
      lookupService.getDepartments().then(setDepartments);
      lookupService
        .getManagers()
        .then(setManagers)
        .catch(() => setManagers([]));
    }
  }, [open]);

  // Mode handling: Reset or Load data
  useEffect(() => {
    if (open) {
      if (mode === "create") {
        reset(INITIAL_FORM_STATE as EmployeeFormValues);
        setAttachments([]);
        setAvatarFile(null);
      } else if (mode === "edit" && employee) {
        reset({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone || "",
          dateOfBirth: employee.dateOfBirth,
          hireDate: employee.hireDate,
          departmentId: employee.departmentId || 0,
          positionId: employee.positionId || 0,
          salary: employee.salary || 0,
          address: employee.address || "",
          city: employee.city || "",
          emergencyContactName: employee.emergencyContactName || "",
          emergencyContactPhone: employee.emergencyContactPhone || "",
          socialSecurityNumber: employee.socialSecurityNumber || "",
          nationalId: employee.nationalId || "",
          bankAccountNumber: employee.bankAccountNumber || "",
          bankName: employee.bankName || "",
          reportingManagerId: employee.reportingManagerId || undefined,
          contractType: (employee.contractType as any) || "FULL_TIME",
          contractStartDate:
            employee.contractStartDate || employee.hireDate || undefined,
          contractDurationMonths: employee.contractDurationMonths || 12,
          nationality:
            employee.nationality || EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY,
          gender: (employee.gender as any) || "MALE",
          avatarUrl: employee.avatarUrl || "",
          notes: employee.notes || "",
          workStatus: (employee.workStatus as any) || "ACTIVE",
        });
        setAttachments([]);
        setAvatarFile(null);
      }
    }
  }, [open, mode, employee, reset]);

  // Load positions when department changes
  useEffect(() => {
    if (departmentId) {
      setPositionsLoading(true);
      lookupService
        .getPositions(departmentId)
        .then((posList) => {
          setPositions(posList);
          // In edit mode, if we are loading for the first time
          if (mode === "edit" && employee && !positionId) {
            const pos = posList.find((p) => p.title === employee.position);
            if (pos) {
              setValue("positionId", pos.id);
            }
          }
        })
        .finally(() => setPositionsLoading(false));
    } else {
      setPositions([]);
    }
  }, [departmentId, mode, employee, setValue, positionId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setValue("avatarUrl", url);
    }
  };

  const handleAttachmentsSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: EmployeeFormValues) => {
    if (mode === "edit" && !employeeId) {
      return;
    }

    setLoading(true);
    try {
      const payload: EmployeeRequest = {
        ...data,
        avatarUrl: avatarUrl?.startsWith("blob:")
          ? undefined
          : avatarUrl?.trim() || undefined,
        // Convert empty strings to undefined for backend
        phone: data.phone?.trim() || undefined,
        nationalId: data.nationalId?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        emergencyContactName: data.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: data.emergencyContactPhone?.trim() || undefined,
        bankName: data.bankName?.trim() || undefined,
        bankAccountNumber: data.bankAccountNumber?.trim() || undefined,
        socialSecurityNumber: data.socialSecurityNumber?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        nationality: data.nationality?.trim() || undefined,
      };

      let savedEmployee: EmployeeResponse;
      if (mode === "create") {
        savedEmployee = await employeeService.createEmployee(payload);
        toast.success(SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_SUCCESS);
      } else {
        savedEmployee = await employeeService.updateEmployee(
          employeeId!,
          payload,
        );
        toast.success(SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_SUCCESS);
      }

      const targetId = savedEmployee.id;

      if (avatarFile) {
        await employeeService.uploadEmployeeFile(
          targetId,
          avatarFile,
          "AVATAR",
        );
      }

      if (attachments.length > 0) {
        await Promise.all(
          attachments.map((file) =>
            employeeService.uploadEmployeeFile(targetId, file, "DOCUMENT"),
          ),
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error(error);
      if (applyServerValidationErrors(error)) {
        return;
      }

      const rawMessage = error.response?.data?.message;
      const msg =
        rawMessage ===
        "Request body is invalid or missing. Please check the JSON format"
          ? SYSTEM_MESSAGES.EMPLOYEE.MSG_VALIDATION_ERROR
          : rawMessage ||
            (mode === "create"
              ? SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_ERROR
              : SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_ERROR);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  const title =
    mode === "create"
      ? EMPLOYEE_CONSTANTS.TITLE_CREATE
      : EMPLOYEE_CONSTANTS.TITLE_EDIT;
  const submitBtnText =
    mode === "create"
      ? EMPLOYEE_CONSTANTS.BTNS.CREATE
      : EMPLOYEE_CONSTANTS.BTNS.EDIT;
  const statusColor = mode === "create" ? "bg-emerald-500" : "bg-primary";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col transition-all animate-in fade-in zoom-in duration-200 overflow-hidden border border-border">
        {/* HEADER */}
        <div className="px-8 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-xl z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-inner-sm">
              <User size={22} className="drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold bg-linear-to-br from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent uppercase tracking-tight">
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse`}
                ></span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {SYSTEM_MESSAGES.EMPLOYEE.SYSTEM_HR}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            noValidate
            className="flex-1 overflow-y-auto overscroll-contain p-8 custom-scrollbar"
          >
            <EmployeeFormFields
              departments={departments}
              positions={positions}
              managers={managers}
              positionsLoading={positionsLoading}
              isManagerPosition={isManagerPosition}
              handleImageUpload={handleImageUpload}
              attachments={attachments}
              onAttachmentsSelected={handleAttachmentsSelected}
              onRemoveAttachment={handleRemoveAttachment}
            />

            {/* ACTIONS */}
            <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Info size={14} /> {EMPLOYEE_CONSTANTS.MESSAGES.AUTO_CODE_INFO}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted transition active:scale-95"
                >
                  {SYSTEM_MESSAGES.BTN_CANCEL}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {submitBtnText}
                </button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
