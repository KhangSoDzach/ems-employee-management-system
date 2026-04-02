import React from "react";
import { useFormContext } from "react-hook-form";
import { Info, UploadCloud } from "lucide-react";
import {
  DepartmentOption,
  PositionOption,
  ManagerOption,
} from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { EMPLOYEE_CONSTANTS } from "../employee.constants";
import { EmployeeFormValues } from "../schemas/employee.schema";

interface EmployeeFormFieldsProps {
  departments: DepartmentOption[];
  positions: PositionOption[];
  managers: ManagerOption[];
  positionsLoading: boolean;
  isManagerPosition: boolean;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachments?: File[];
  onAttachmentsSelected?: (files: FileList | null) => void;
  onRemoveAttachment?: (index: number) => void;
}

type Props = Readonly<EmployeeFormFieldsProps>;

export default function EmployeeFormFields(props: Props) {
  const {
    departments,
    positions,
    managers,
    positionsLoading,
    isManagerPosition,
    handleImageUpload,
    attachments = [],
    onAttachmentsSelected,
    onRemoveAttachment,
  } = props;

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<EmployeeFormValues>();

  const formData = watch();

  const hasError = (field: keyof EmployeeFormValues) => !!errors[field];

  const inputClass = (field: keyof EmployeeFormValues) =>
    `w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-medium ${
      hasError(field)
        ? "border-red-500 ring-2 ring-red-500/10 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
        : "border-border focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card"
    }`;

  const selectClass = (field: keyof EmployeeFormValues) =>
    `w-full px-3 py-2.5 rounded-xl border outline-none transition-all text-sm font-bold bg-card ${
      hasError(field)
        ? "border-red-500 ring-2 ring-red-500/10 focus:ring-red-500 focus:border-red-500 bg-red-50/10"
        : "border-border focus:ring-2 focus:ring-primary/20 focus:border-primary"
    }`;

  let positionLabel = "";
  if (!formData.departmentId) {
    positionLabel = EMPLOYEE_CONSTANTS.PLACEHOLDERS.DEPT_SELECT;
  } else if (positionsLoading) {
    positionLabel = SYSTEM_MESSAGES.LOADING;
  } else if (positions.length === 0) {
    positionLabel = EMPLOYEE_CONSTANTS.MESSAGES.NO_POSITIONS;
  } else {
    positionLabel = EMPLOYEE_CONSTANTS.PLACEHOLDERS.POS_SELECT;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: PERSONAL & ADDRESS */}
      <div className="lg:col-span-2 space-y-8">
        {/* SECTION: BASIC INFO */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <h4 className="flex items-center gap-3 text-sm font-bold text-primary border-l-4 border-primary pl-4 uppercase tracking-widest">
            {EMPLOYEE_CONSTANTS.SECTIONS.BASIC}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.LAST_NAME}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("lastName")}
                className={inputClass("lastName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.LAST_NAME}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.FIRST_NAME}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("firstName")}
                className={inputClass("firstName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.FIRST_NAME}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMAIL}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                type="email"
                {...register("email")}
                className={inputClass("email")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMAIL}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.PHONE}
              </label>
              <input
                {...register("phone")}
                className={inputClass("phone")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.PHONE}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.GENDER}
              </label>
              <select {...register("gender")} className={selectClass("gender")}>
                <option value="MALE">
                  {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.MALE}
                </option>
                <option value="FEMALE">
                  {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.FEMALE}
                </option>
                <option value="OTHER">
                  {EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.OTHER}
                </option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.DOB}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className={inputClass("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.NATIONAL_ID}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("nationalId")}
                className={inputClass("nationalId")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONAL_ID}
              />
              {errors.nationalId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.nationalId.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.SOCIAL_ID}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("socialSecurityNumber")}
                className={inputClass("socialSecurityNumber")}
                placeholder={
                  SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_SOCIAL_WARRANTY_NUMBER
                }
              />
              {errors.socialSecurityNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.socialSecurityNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: ADDRESS & EMERGENCY */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <h4 className="flex items-center gap-3 text-sm font-bold text-blue-500 border-l-4 border-blue-500 pl-4 uppercase tracking-widest">
            {EMPLOYEE_CONSTANTS.SECTIONS.CONTACT_ADDRESS}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.ADDRESS}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("address")}
                className={inputClass("address")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.ADDRESS}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.CITY}
              </label>
              <input
                {...register("city")}
                className={inputClass("city")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.CITY}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.NATIONALITY}
              </label>
              <input
                {...register("nationality")}
                className={inputClass("nationality")}
              />
              {errors.nationality && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.nationality.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_NAME}
              </label>
              <input
                {...register("emergencyContactName")}
                className={inputClass("emergencyContactName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMERGENCY_NAME}
              />
              {errors.emergencyContactName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergencyContactName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_PHONE}
              </label>
              <input
                {...register("emergencyContactPhone")}
                className={inputClass("emergencyContactPhone")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.PHONE}
              />
              {errors.emergencyContactPhone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergencyContactPhone.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: ATTACHMENTS */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <h4 className="flex items-center gap-3 text-sm font-bold text-teal-500 border-l-4 border-teal-500 pl-4 uppercase tracking-widest">
            {EMPLOYEE_CONSTANTS.SECTIONS.NOTES_AVATAR}
          </h4>
          <div className="w-full bg-muted/30 border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative group">
            <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300 mb-3" />
            <h5 className="text-sm font-bold text-foreground mb-1">
              {EMPLOYEE_CONSTANTS.MESSAGES.ATTACH_FILE}
            </h5>
            <p className="text-xs text-muted-foreground">
              {EMPLOYEE_CONSTANTS.MESSAGES.DRAG_DROP}
            </p>
            <input
              type="file"
              multiple
              onChange={(e) => onAttachmentsSelected?.(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title={EMPLOYEE_CONSTANTS.MESSAGES.ATTACH_FILE}
            />
          </div>
          {attachments.length > 0 && (
            <div className="space-y-2 mt-4">
              {attachments.map((file, idx) => (
                <div
                  key={`${file.name}-${file.lastModified}-${idx}`}
                  className="flex justify-between items-center p-3 bg-muted/40 border border-border rounded-xl text-sm"
                >
                  <span className="truncate max-w-[200px] text-foreground font-medium">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment?.(idx)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-colors"
                  >
                    {SYSTEM_MESSAGES.EMPLOYEE.TXT_REMOVE}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: AVATAR, JOB & FINANCE */}
      <div className="space-y-8">
        {/* SECTION: AVATAR */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">
            {EMPLOYEE_CONSTANTS.LABELS.NOTES_AVATAR || "Avatar"}
          </label>
          <div className="w-full aspect-square max-h-64 mx-auto bg-card border-2 border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt={EMPLOYEE_CONSTANTS.LABELS.NOTES_AVATAR}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">
                  {EMPLOYEE_CONSTANTS.MESSAGES.ATTACH_FILE}
                </p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors cursor-pointer" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title={EMPLOYEE_CONSTANTS.SECTIONS.NOTES_AVATAR}
            />
          </div>
          <input
            {...register("avatarUrl")}
            placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.FIRST_NAME}
            className={inputClass("avatarUrl") + " mt-3 text-xs w-full"}
          />
        </div>

        {/* SECTION: CURRENT JOB */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <h4 className="flex items-center gap-3 text-sm font-bold text-indigo-500 border-l-4 border-indigo-500 pl-4 uppercase tracking-widest">
            {EMPLOYEE_CONSTANTS.SECTIONS.JOB}
          </h4>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.DEPARTMENT}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <select
                {...register("departmentId", {
                  valueAsNumber: true,
                  onChange: () => {
                    setValue("positionId", 0);
                    setValue("reportingManagerId", undefined);
                  },
                })}
                className={selectClass("departmentId")}
              >
                <option value={0}>
                  {SYSTEM_MESSAGES.EMPLOYEE.SELECT_DEPT}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.POSITION}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <select
                {...register("positionId", { valueAsNumber: true })}
                disabled={!formData.departmentId || positionsLoading}
                className={
                  selectClass("positionId") +
                  " disabled:opacity-50 disabled:cursor-not-allowed"
                }
              >
                <option value={0}>{positionLabel}</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {!formData.departmentId && (
                <p className="text-[10px] text-muted-foreground italic">
                  {EMPLOYEE_CONSTANTS.MESSAGES.DEPT_REQUIRED}
                </p>
              )}
              {errors.positionId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.positionId.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_TYPE}
              </label>
              <select
                {...register("contractType")}
                className={selectClass("contractType")}
              >
                <option value="FULL_TIME">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.FULL_TIME}
                </option>
                <option value="PART_TIME">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.PART_TIME}
                </option>
                <option value="CONTRACT">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.CONTRACT}
                </option>
                <option value="INTERN">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.INTERN}
                </option>
                <option value="CONSULTANT">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.CONSULTANT}
                </option>
                <option value="TEMPORARY">
                  {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.TEMPORARY}
                </option>
              </select>
            </div>
            {formData.contractType === "CONTRACT" && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="contractDurationMonths"
                    className="text-xs font-bold text-muted-foreground uppercase"
                  >
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_CONTRACT_TERM}
                  </label>
                  <select
                    id="contractDurationMonths"
                    {...register("contractDurationMonths", {
                      valueAsNumber: true,
                    })}
                    className={selectClass("contractDurationMonths")}
                  >
                    <option value={12}>
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_MONTHS(12)}
                    </option>
                    <option value={24}>
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_MONTHS(24)}
                    </option>
                    <option value={36}>
                      {SYSTEM_MESSAGES.EMPLOYEE.LABEL_MONTHS(36)}
                    </option>
                  </select>
                  {errors.contractDurationMonths && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractDurationMonths.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="contractStartDate"
                    className="text-xs font-bold text-muted-foreground uppercase"
                  >
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_CONTRACT_START}
                  </label>
                  <input
                    id="contractStartDate"
                    type="date"
                    {...register("contractStartDate")}
                    className={inputClass("contractStartDate")}
                  />
                  {errors.contractStartDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractStartDate.message}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.HIRE_DATE}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                type="date"
                {...register("hireDate")}
                className={inputClass("hireDate")}
              />
              {errors.hireDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.hireDate.message}
                </p>
              )}
            </div>

            {isManagerPosition === false ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  {EMPLOYEE_CONSTANTS.LABELS.MANAGER}
                  {!formData.positionId ? (
                    <span className="text-[10px] font-normal text-muted-foreground italic normal-case">
                      {EMPLOYEE_CONSTANTS.MESSAGES.MANAGER_HINT}
                    </span>
                  ) : (
                    <span className="text-red-500" aria-hidden="true">
                      {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                    </span>
                  )}
                </label>
                <select
                  {...register("reportingManagerId", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                  disabled={!formData.positionId}
                  className={
                    selectClass("reportingManagerId") +
                    " disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-primary/20"
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
                {errors.reportingManagerId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.reportingManagerId.message}
                  </p>
                )}
                {managers.length === 0 && formData.positionId > 0 && (
                  <p className="text-[10px] text-amber-500 italic mt-1">
                    {SYSTEM_MESSAGES.EMPLOYEE.MSG_NO_MANAGERS}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3 flex items-start gap-3 border border-blue-100 dark:border-blue-900/30">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                  {EMPLOYEE_CONSTANTS.MESSAGES.MANAGER_LEVEL_INFO}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: FINANCE */}
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm space-y-6">
          <h4 className="flex items-center gap-3 text-sm font-bold text-amber-500 border-l-4 border-amber-500 pl-4 uppercase tracking-widest">
            {EMPLOYEE_CONSTANTS.SECTIONS.FINANCE}
          </h4>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.SALARY}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register("salary", { valueAsNumber: true })}
                  className={
                    inputClass("salary") + " pl-4 pr-12 text-blue-600 font-bold"
                  }
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  {EMPLOYEE_CONSTANTS.LABELS.CURRENCY}
                </span>
              </div>
              {errors.salary && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.salary.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.BANK_NAME}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("bankName")}
                className={inputClass("bankName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.BANK_NAME}
              />
              {errors.bankName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.bankName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.BANK_ACCOUNT}{" "}
                <span className="text-red-500" aria-hidden="true">
                  {EMPLOYEE_CONSTANTS.MESSAGES.REQUIRED_MARK}
                </span>
              </label>
              <input
                {...register("bankAccountNumber")}
                className={
                  inputClass("bankAccountNumber") +
                  " tracking-widest font-bold font-mono"
                }
              />
              {errors.bankAccountNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.bankAccountNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
