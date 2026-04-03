import { useState, useEffect } from "react";
import { X, Save, User, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { employeeService, EmployeeRequest } from "@/services/employeeService";
import {
  lookupService,
  DepartmentOption,
  PositionOption,
  ManagerOption,
  MANAGER_LEVEL,
} from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";
import { EMPLOYEE_CONSTANTS } from "../../constants/employee.constants";

type ApiError = {
  response?: {
    data?: {
      fieldErrors?: Record<string, unknown>;
      message?: string;
    };
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeCreateModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [managers, setManagers] = useState<ManagerOption[]>([]);

  const [formData, setFormData] = useState<EmployeeRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    hireDate: new Date().toISOString().slice(0, 10),
    departmentId: 0,
    positionId: 0,
    salary: 0,
    gender: EMPLOYEE_CONSTANTS.GENDER.MALE as any,
    workStatus: EMPLOYEE_CONSTANTS.STATUS.PROBATION as any,
    contractType: EMPLOYEE_CONSTANTS.CONTRACT_TYPES.FULL_TIME as any,
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        toast.error(firstFieldError);
      }
      return true;
    }
    return false;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 1. Basic Information
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

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = FORM_VALIDATION_MESSAGES.DOB_REQUIRED;
    }
    if (!formData.nationalId?.trim()) {
      newErrors.nationalId = FORM_VALIDATION_MESSAGES.ID_REQUIRED;
    } else if (
      !EMPLOYEE_CONSTANTS.VALIDATION.ID_REGEX.test(formData.nationalId)
    ) {
      newErrors.nationalId = FORM_VALIDATION_MESSAGES.ID_FORMAT;
    }

    // 2. Job Information
    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = FORM_VALIDATION_MESSAGES.DEPT_REQUIRED;
    }
    if (!formData.positionId || formData.positionId === 0) {
      newErrors.positionId = FORM_VALIDATION_MESSAGES.ROLE_REQUIRED;
    }
    if (!formData.hireDate) {
      newErrors.hireDate = FORM_VALIDATION_MESSAGES.START_DATE_REQUIRED;
    }

    // 3. Finance & Address
    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = FORM_VALIDATION_MESSAGES.SALARY_REQUIRED;
    }
    if (!formData.address?.trim()) {
      newErrors.address = FORM_VALIDATION_MESSAGES.ADDRESS_REQUIRED;
    }

    // 4. Optional but format check
    if (formData.phone?.trim() && !/^\d{10,13}$/.test(formData.phone.trim())) {
      newErrors.phone = FORM_VALIDATION_MESSAGES.PHONE_FORMAT;
    }
    if (
      formData.bankAccountNumber?.trim() &&
      !EMPLOYEE_CONSTANTS.VALIDATION.BANK_ACC_REGEX.test(
        formData.bankAccountNumber.trim(),
      )
    ) {
      newErrors.bankAccountNumber = FORM_VALIDATION_MESSAGES.BANK_ACC_FORMAT;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(
        Object.values(newErrors)[0] ??
          SYSTEM_MESSAGES.EMPLOYEE.MSG_VALIDATION_ERROR,
      );
    }
    return Object.keys(newErrors).length === 0;
  };

  const hasError = (field: string) => !!errors[field];
  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-medium ${
      hasError(field)
        ? "border-red-500 ring-2 ring-red-500/10 focus:ring-red-500 focus:border-red-500"
        : "border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card"
    }`;
  const selectClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold bg-card ${
      hasError(field)
        ? "border-red-500 ring-2 ring-red-500/10 focus:ring-red-500 focus:border-red-500"
        : "border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
    }`;

  // ✅ AFTER formData is declared — safe to access formData.positionId
  const selectedPosition = positions.find((p) => p.id === formData.positionId);
  const isManagerPosition = selectedPosition
    ? selectedPosition.level >= MANAGER_LEVEL
    : false;

  useEffect(() => {
    if (open) {
      lookupService.getDepartments().then(setDepartments);
      lookupService
        .getManagers()
        .then(setManagers)
        .catch(() => setManagers([]));
    }
  }, [open]);

  useEffect(() => {
    if (formData.departmentId) {
      setPositionsLoading(true);
      setPositions([]);
      lookupService
        .getPositions(formData.departmentId)
        .then(setPositions)
        .catch(() => setPositions([]))
        .finally(() => setPositionsLoading(false));
    } else {
      setPositions([]);
    }
  }, [formData.departmentId]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Sanitize: convert empty strings to undefined so backend doesn't fail regex validation
    const payload: EmployeeRequest = {
      ...formData,
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
      await employeeService.createEmployee(payload);
      toast.success(SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_SUCCESS);
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      if (applyServerValidationErrors(error)) {
        return;
      }
      const rawMessage = (error as ApiError)?.response?.data?.message;
      const msg =
        rawMessage ===
        "Request body is invalid or missing. Please check the JSON format"
          ? SYSTEM_MESSAGES.EMPLOYEE.MSG_VALIDATION_ERROR
          : rawMessage || SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_ERROR;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          name === "departmentId" || name === "positionId" || name === "salary"
            ? Number(value)
            : name === "reportingManagerId"
              ? value === ""
                ? undefined
                : Number(value)
              : value,
      };
      // Reset positionId when department changes
      if (name === "departmentId") {
        updated.positionId = 0;
        updated.reportingManagerId = undefined;
      }
      return updated;
    });

    // Clear field-level validation errors as user types
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col transition-all animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">
              {EMPLOYEE_CONSTANTS.TITLE_CREATE}
            </h2>
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
          className="flex-1 overflow-y-auto overscroll-contain p-8 custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* SECTION: PERSONAL */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-primary border-l-4 border-primary pl-3 uppercase tracking-widest">
                  {EMPLOYEE_CONSTANTS.SECTIONS.BASIC}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.LAST_NAME}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={inputClass("lastName")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.LAST_NAME}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.FIRST_NAME}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={inputClass("firstName")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.FIRST_NAME}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.EMAIL}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass("email")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMAIL}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.PHONE}
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass("phone")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.PHONE}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.GENDER}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={selectClass("gender")}
                    >
                      <option value={EMPLOYEE_CONSTANTS.GENDER.MALE}>
                        {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.MALE}
                      </option>
                      <option value={EMPLOYEE_CONSTANTS.GENDER.FEMALE}>
                        {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.FEMALE}
                      </option>
                      <option value={EMPLOYEE_CONSTANTS.GENDER.OTHER}>
                        {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.OTHER}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_DOB}{" "}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={inputClass("dateOfBirth")}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.NATIONAL_ID}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={handleChange}
                      className={inputClass("nationalId")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONAL_ID}
                    />
                    {errors.nationalId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.nationalId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-500 border-l-4 border-blue-500 pl-3 uppercase tracking-widest">
                  {EMPLOYEE_CONSTANTS.SECTIONS.CONTACT_ADDRESS}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.ADDRESS}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className={inputClass("address")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.ADDRESS}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.CITY}
                    </label>
                    <input
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                      className={inputClass("city")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.CITY}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.NATIONALITY}
                    </label>
                    <input
                      name="nationality"
                      value={formData.nationality || ""}
                      onChange={handleChange}
                      className={inputClass("nationality")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_NAME}
                    </label>
                    <input
                      name="emergencyContactName"
                      value={formData.emergencyContactName || ""}
                      onChange={handleChange}
                      className={inputClass("emergencyContactName")}
                      placeholder={
                        EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMERGENCY_NAME
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_PHONE}
                    </label>
                    <input
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone || ""}
                      onChange={handleChange}
                      className={inputClass("emergencyContactPhone")}
                      placeholder={
                        EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMERGENCY_PHONE
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: JOB & FINANCE */}
            <div className="space-y-8 bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-500 border-l-4 border-indigo-500 pl-3 uppercase tracking-widest">
                  {EMPLOYEE_CONSTANTS.SECTIONS.JOB}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.DEPARTMENT}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <select
                      required
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className={selectClass("departmentId")}
                    >
                      <option value={0}>
                        {EMPLOYEE_CONSTANTS.PLACEHOLDERS.DEPT_SELECT}
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.departmentId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.POSITION}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <select
                      required
                      name="positionId"
                      value={formData.positionId}
                      onChange={handleChange}
                      disabled={!formData.departmentId || positionsLoading}
                      className={
                        selectClass("positionId") +
                        " disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                    >
                      <option value={0}>
                        {!formData.departmentId
                          ? `${SYSTEM_MESSAGES.SYMBOLS.EM_DASH}${SYSTEM_MESSAGES.SYMBOLS.SPACE}${EMPLOYEE_CONSTANTS.MESSAGES.MANAGER_HINT}${SYSTEM_MESSAGES.SYMBOLS.SPACE}${SYSTEM_MESSAGES.SYMBOLS.EM_DASH}`
                          : positionsLoading
                            ? SYSTEM_MESSAGES.LOADING_SHORT
                            : positions.length === 0
                              ? EMPLOYEE_CONSTANTS.MESSAGES.NO_POSITIONS
                              : EMPLOYEE_CONSTANTS.PLACEHOLDERS.POS_SELECT}
                      </option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    {!formData.departmentId && (
                      <p className="text-[10px] text-gray-400 italic">
                        {EMPLOYEE_CONSTANTS.MESSAGES.DEPT_HINT}
                      </p>
                    )}
                    {errors.positionId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.positionId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_TYPE}
                    </label>
                    <select
                      name="contractType"
                      value={formData.contractType}
                      onChange={handleChange}
                      className={selectClass("contractType")}
                    >
                      <option
                        value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.FULL_TIME}
                      >
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.FULL_TIME}
                      </option>
                      <option
                        value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.PART_TIME}
                      >
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.PART_TIME}
                      </option>
                      <option
                        value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.CONTRACT}
                      >
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.CONTRACT}
                      </option>
                      <option value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.INTERN}>
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.INTERN}
                      </option>
                      <option
                        value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.CONSULTANT}
                      >
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.CONSULTANT}
                      </option>
                      <option
                        value={EMPLOYEE_CONSTANTS.CONTRACT_TYPES.TEMPORARY}
                      >
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.TEMPORARY}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_JOIN_DATE}{" "}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <input
                      required
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      className={inputClass("hireDate")}
                    />
                    {errors.hireDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.hireDate}
                      </p>
                    )}
                  </div>

                  {/* Reporting Manager — chỉ hiện khi vị trí KHÔNG phải manager */}
                  {!isManagerPosition && (
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        {EMPLOYEE_CONSTANTS.LABELS.MANAGER}
                        {!formData.positionId && (
                          <span className="text-[10px] font-normal text-muted-foreground italic normal-case">
                            ({EMPLOYEE_CONSTANTS.MESSAGES.MANAGER_HINT})
                          </span>
                        )}
                      </label>
                      <select
                        name="reportingManagerId"
                        value={formData.reportingManagerId ?? ""}
                        onChange={handleChange}
                        disabled={!formData.positionId}
                        className={
                          selectClass("reportingManagerId") +
                          " disabled:opacity-50 disabled:cursor-not-allowed"
                        }
                      >
                        <option value="">
                          {EMPLOYEE_CONSTANTS.PLACEHOLDERS.MANAGER_NONE}
                        </option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.position ? `(${m.position})` : ""}
                          </option>
                        ))}
                      </select>
                      {managers.length === 0 && formData.positionId > 0 && (
                        <p className="text-[10px] text-amber-500 italic">
                          {EMPLOYEE_CONSTANTS.MESSAGES.NO_MANAGERS}
                        </p>
                      )}
                    </div>
                  )}
                  {isManagerPosition && (
                    <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <Info size={14} className="text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {EMPLOYEE_CONSTANTS.MESSAGES.MANAGER_LEVEL_INFO}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-500 border-l-4 border-amber-500 pl-3 uppercase tracking-widest">
                  {EMPLOYEE_CONSTANTS.SECTIONS.FINANCE}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">
                      {EMPLOYEE_CONSTANTS.LABELS.SALARY}
                      {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                      <span className="text-red-500">
                        {SYSTEM_MESSAGES.SYMBOLS.ASTERISK}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        className={
                          inputClass("salary") +
                          " pl-4 pr-12 text-blue-600 font-bold"
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                        {EMPLOYEE_CONSTANTS.PLACEHOLDERS.CURRENCY}
                      </span>
                    </div>
                    {errors.salary && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.salary}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_BANK_NAME}
                    </label>
                    <input
                      name="bankName"
                      value={formData.bankName || ""}
                      onChange={handleChange}
                      className={inputClass("bankName")}
                      placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.BANK_NAME}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_BANK_ACCOUNT}
                    </label>
                    <input
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ""}
                      onChange={handleChange}
                      className={
                        inputClass("bankAccountNumber") + " tracking-widest"
                      }
                    />
                    {errors.bankAccountNumber && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.bankAccountNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AVATAR & NOTES */}
            {/* ... simplified for now ... */}
          </div>

          {/* ACTIONS */}
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info size={14} /> {EMPLOYEE_CONSTANTS.MESSAGES.AUTO_CODE_INFO}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted transition"
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
                {EMPLOYEE_CONSTANTS.BTNS.CREATE}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
