import { useState, useEffect } from "react";
import { X, Save, User, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
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
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { EMPLOYEE_CONSTANTS } from "../employee.constants";
import EmployeeFormFields from "./EmployeeFormFields";

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

const INITIAL_FORM_STATE: EmployeeRequest = {
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
  contractStartDate: new Date().toISOString().slice(0, 10),
  contractDurationMonths: 12,
  nationality: EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY,
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  nationalId: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  bankName: "",
  bankAccountNumber: "",
  bankBranch: "",
  taxId: "",
  socialSecurityNumber: "",
  workLocation: "",
  notes: "",
};

type ReadonlyProps = Readonly<Props>;

export default function EmployeeFormModal(props: ReadonlyProps) {
  const { open, mode, employeeId, employee, onClose, onSuccess } = props;

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [managers, setManagers] = useState<ManagerOption[]>([]);

  const [formData, setFormData] = useState<EmployeeRequest>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const normalizeValidationMessage = (message: string): string => {
    const parts = message
      .split("|")
      .map((part) => part.trim())
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
      const normalized: Record<string, string> = {};
      Object.entries(fieldErrors as Record<string, unknown>).forEach(
        ([field, message]) => {
          if (typeof message === "string") {
            normalized[field] = normalizeValidationMessage(message);
          }
        },
      );
      setErrors((prev) => ({ ...prev, ...normalized }));
      const firstFieldError = Object.values(normalized)[0];
      if (firstFieldError) {
        toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
      }
      return true;
    }
    return false;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = FORM_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = FORM_VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    }

    if (!formData.email?.trim()) {
      newErrors.email = FORM_VALIDATION_MESSAGES.EMAIL_REQUIRED;
    } else if (
      !EMPLOYEE_CONSTANTS.VALIDATION.EMAIL_REGEX.test(formData.email)
    ) {
      newErrors.email = FORM_VALIDATION_MESSAGES.EMAIL_INVALID;
    }

    if (formData.phone?.trim() && !/^\d{10,13}$/.test(formData.phone.trim())) {
      newErrors.phone = FORM_VALIDATION_MESSAGES.PHONE_FORMAT;
    }

    if (!formData.departmentId) {
      newErrors.departmentId = FORM_VALIDATION_MESSAGES.DEPT_REQUIRED;
    }
    if (!formData.positionId) {
      newErrors.positionId = FORM_VALIDATION_MESSAGES.ROLE_REQUIRED;
    }

    if (formData.dateOfBirth === undefined || formData.dateOfBirth === "") {
      newErrors.dateOfBirth = FORM_VALIDATION_MESSAGES.DOB_REQUIRED;
    } else {
      const birth = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateOfBirth = FORM_VALIDATION_MESSAGES.AGE_MIN;
      }
    }

    if (!formData.hireDate) {
      newErrors.hireDate = FORM_VALIDATION_MESSAGES.START_DATE_REQUIRED;
    }

    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = FORM_VALIDATION_MESSAGES.ID_REQUIRED;
    } else if (
      !EMPLOYEE_CONSTANTS.VALIDATION.ID_REGEX.test(formData.nationalId.trim())
    ) {
      newErrors.nationalId = FORM_VALIDATION_MESSAGES.ID_FORMAT;
    }

    if (!formData.socialSecurityNumber) {
      newErrors.socialSecurityNumber =
        FORM_VALIDATION_MESSAGES.SOCIAL_WARRANTY_NUMBER_REQUIRED;
    } else if (!/^\d{10}$/.test(formData.socialSecurityNumber)) {
      newErrors.socialSecurityNumber =
        FORM_VALIDATION_MESSAGES.SOCIAL_WARRANTY_NUMBER_FORMAT;
    }

    if (!formData.address?.trim()) {
      newErrors.address = FORM_VALIDATION_MESSAGES.ADDRESS_REQUIRED;
    }

    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = FORM_VALIDATION_MESSAGES.SALARY_REQUIRED;
    }

    if (formData.contractType === "CONTRACT") {
      if (!formData.contractStartDate) {
        newErrors.contractStartDate =
          FORM_VALIDATION_MESSAGES.CONTRACT_START_DATE_REQUIRED;
      }
      if (
        !formData.contractDurationMonths ||
        ![12, 24, 36].includes(formData.contractDurationMonths)
      ) {
        newErrors.contractDurationMonths =
          FORM_VALIDATION_MESSAGES.CONTRACT_DURATION_INVALID;
      }
    }

    if (!formData.bankName?.trim()) {
      newErrors.bankName = FORM_VALIDATION_MESSAGES.BANK_NAME_REQUIRED;
    }

    if (!formData.bankAccountNumber?.trim()) {
      newErrors.bankAccountNumber = FORM_VALIDATION_MESSAGES.BANK_ACC_REQUIRED;
    } else if (
      !EMPLOYEE_CONSTANTS.VALIDATION.BANK_ACC_REGEX.test(
        formData.bankAccountNumber.trim(),
      )
    ) {
      newErrors.bankAccountNumber = FORM_VALIDATION_MESSAGES.BANK_ACC_FORMAT;
    }

    if (!isManagerPosition && !formData.reportingManagerId) {
      newErrors.reportingManagerId = FORM_VALIDATION_MESSAGES.MANAGER_REQUIRED;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(FORM_VALIDATION_MESSAGES.MISSING_CONTENT);
    }
    return Object.keys(newErrors).length === 0;
  };

  const hasError = (field: string) => !!errors[field];
  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl outline-none transition-all text-sm font-medium bg-card ${
      hasError(field)
        ? "border-red-500 focus:ring-red-500"
        : "border border-border focus:ring-2 focus:ring-primary"
    }`;
  const selectClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl outline-none transition-all text-sm font-bold bg-card ${
      hasError(field)
        ? "border-red-500 focus:ring-red-500"
        : "border border-border"
    }`;

  const selectedPosition = positions.find((p) => p.id === formData.positionId);
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
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
        setAttachments([]);
        setAvatarFile(null);
      } else if (mode === "edit" && employee) {
        setFormData({
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
          state: employee.state || "",
          zipCode: employee.zipCode || "",
          country: employee.country || "",
          emergencyContactName: employee.emergencyContactName || "",
          emergencyContactPhone: employee.emergencyContactPhone || "",
          emergencyContactRelation: employee.emergencyContactRelation || "",
          taxId: employee.taxId || "",
          socialSecurityNumber: employee.socialSecurityNumber || "",
          nationalId: employee.nationalId || "",
          bankAccountNumber: employee.bankAccountNumber || "",
          bankName: employee.bankName || "",
          bankBranch: employee.bankBranch || "",
          reportingManagerId: employee.reportingManagerId || undefined,
          contractType: employee.contractType || "FULL_TIME",
          contractStartDate:
            employee.contractStartDate || employee.hireDate || undefined,
          probationEndDate: employee.probationEndDate || undefined,
          contractEndDate: employee.contractEndDate || undefined,
          contractDurationMonths: employee.contractDurationMonths || 12,
          workLocation: employee.workLocation || "",
          nationality:
            employee.nationality || EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY,
          bloodGroup: employee.bloodGroup || "",
          gender: employee.gender || "MALE",
          avatarUrl: employee.avatarUrl || "",
          notes: employee.notes || "",
        });
        setErrors({});
        setAttachments([]);
        setAvatarFile(null);
      }
    }
  }, [open, mode, employee]);

  // Handle mapping when only string name is available (for safety/backward compat)
  useEffect(() => {
    if (
      open &&
      mode === "edit" &&
      departments.length > 0 &&
      employee &&
      !formData.departmentId
    ) {
      const dept = departments.find((d) => d.name === employee.department);
      if (dept) {
        setFormData((prev) => ({ ...prev, departmentId: dept.id }));
      }
    }
  }, [open, mode, departments, employee, formData.departmentId]);

  // Load positions when department changes
  useEffect(() => {
    if (formData.departmentId) {
      setPositionsLoading(true);
      lookupService
        .getPositions(formData.departmentId)
        .then((posList) => {
          setPositions(posList);
          // In edit mode, if we just changed department, check if the old position title exists in the new list
          if (mode === "edit" && employee && !formData.positionId) {
            const pos = posList.find((p) => p.title === employee.position);
            if (pos) {
              setFormData((prev) => ({ ...prev, positionId: pos.id }));
            }
          }
        })
        .finally(() => setPositionsLoading(false));
    } else {
      setPositions([]);
    }
  }, [formData.departmentId, formData.positionId, mode, employee]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]:
          name === "departmentId" ||
          name === "positionId" ||
          name === "salary" ||
          name === "contractDurationMonths"
            ? Number(value)
            : name === "reportingManagerId"
              ? value === ""
                ? undefined
                : Number(value)
              : value,
      };
      if (name === "departmentId") {
        updated.positionId = 0;
        updated.reportingManagerId = undefined;
        setPositions([]);
      }
      if (name === "contractType" && value !== "CONTRACT") {
        updated.contractDurationMonths = undefined;
      }
      return updated;
    });

    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "edit" && !employeeId) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload: EmployeeRequest = {
      ...formData,
      avatarUrl: formData.avatarUrl?.startsWith("blob:")
        ? undefined
        : formData.avatarUrl?.trim() || undefined,
      contractEndDate:
        formData.contractType === "CONTRACT" &&
        formData.contractStartDate &&
        formData.contractDurationMonths
          ? new Date(
              new Date(formData.contractStartDate).getFullYear(),
              new Date(formData.contractStartDate).getMonth() +
                formData.contractDurationMonths,
              new Date(formData.contractStartDate).getDate() - 1,
            )
              .toISOString()
              .slice(0, 10)
          : formData.contractEndDate,
      phone: formData.phone?.trim() || undefined,
      nationalId: formData.nationalId?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      state: formData.state?.trim() || undefined,
      zipCode: formData.zipCode?.trim() || undefined,
      country: formData.country?.trim() || undefined,
      emergencyContactName: formData.emergencyContactName?.trim() || undefined,
      emergencyContactPhone:
        formData.emergencyContactPhone?.trim() || undefined,
      emergencyContactRelation:
        formData.emergencyContactRelation?.trim() || undefined,
      bankName: formData.bankName?.trim() || undefined,
      bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
      bankBranch: formData.bankBranch?.trim() || undefined,
      taxId: formData.taxId?.trim() || undefined,
      socialSecurityNumber: formData.socialSecurityNumber?.trim() || undefined,
      workLocation: formData.workLocation?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      nationality: formData.nationality?.trim() || undefined,
    };

    setLoading(true);
    try {
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

      const targetEmployeeId = savedEmployee.id;

      if (avatarFile) {
        await employeeService.uploadEmployeeFile(
          targetEmployeeId,
          avatarFile,
          "AVATAR",
        );
      }

      if (attachments.length > 0) {
        await Promise.all(
          attachments.map((file) =>
            employeeService.uploadEmployeeFile(
              targetEmployeeId,
              file,
              "DOCUMENT",
            ),
          ),
        );
      }

      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      if (applyServerValidationErrors(error)) {
        return;
      }

      const rawMessage = (error as ApiError)?.response?.data?.message;
      const errMsg =
        mode === "create"
          ? SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_ERROR
          : SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_ERROR;
      const msg =
        rawMessage ===
        "Request body is invalid or missing. Please check the JSON format"
          ? SYSTEM_MESSAGES.EMPLOYEE.MSG_VALIDATION_ERROR
          : rawMessage || errMsg;
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
  const infoText =
    mode === "create"
      ? EMPLOYEE_CONSTANTS.MESSAGES.AUTO_CODE_INFO
      : EMPLOYEE_CONSTANTS.MESSAGES.AUTO_CODE_INFO;
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
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto overscroll-contain p-8 custom-scrollbar"
        >
          <EmployeeFormFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            departments={departments}
            positions={positions}
            managers={managers}
            positionsLoading={positionsLoading}
            isManagerPosition={isManagerPosition}
            inputClass={inputClass}
            selectClass={selectClass}
            handleImageUpload={handleImageUpload}
            attachments={attachments}
            onAttachmentsSelected={handleAttachmentsSelected}
            onRemoveAttachment={handleRemoveAttachment}
          />

          {/* ACTIONS */}
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info size={14} /> {infoText}
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
      </div>
    </div>
  );
}
