import React from "react";
import { Info, UploadCloud } from "lucide-react";
import { EmployeeRequest } from "@/services/employeeService";
import {
  DepartmentOption,
  PositionOption,
  ManagerOption,
} from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";
import { EMPLOYEE_CONSTANTS } from "../employee.constants";

interface EmployeeFormFieldsProps {
  formData: EmployeeRequest;
  errors: Record<string, string>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  departments: DepartmentOption[];
  positions: PositionOption[];
  managers: ManagerOption[];
  positionsLoading: boolean;
  isManagerPosition: boolean;
  inputClass: (field: string) => string;
  selectClass: (field: string) => string;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachments?: File[];
  onAttachmentsSelected?: (files: FileList | null) => void;
  onRemoveAttachment?: (index: number) => void;
}

type Props = Readonly<EmployeeFormFieldsProps>;

export default function EmployeeFormFields(props: Props) {
  const {
    formData,
    errors,
    handleChange,
    departments,
    positions,
    managers,
    positionsLoading,
    isManagerPosition,
    inputClass,
    selectClass,
    handleImageUpload,
    attachments = [],
    onAttachmentsSelected,
    onRemoveAttachment,
  } = props;

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
                <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className={inputClass("lastName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.LAST_NAME}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.FIRST_NAME}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className={inputClass("firstName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.FIRST_NAME}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMAIL}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className={inputClass("email")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMAIL}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.PHONE}
              </label>
              <input
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className={inputClass("phone")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.PHONE}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.GENDER}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={selectClass("gender")}
              >
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
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth || ""}
                onChange={handleChange}
                className={inputClass("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.NATIONAL_ID}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="nationalId"
                value={formData.nationalId || ""}
                onChange={handleChange}
                className={inputClass("nationalId")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONAL_ID}
              />
              {errors.nationalId && (
                <p className="text-xs text-red-500 mt-1">{errors.nationalId}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.SOCIAL_ID}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="socialSecurityNumber"
                value={formData.socialSecurityNumber || ""}
                onChange={handleChange}
                className={inputClass("socialSecurityNumber")}
                placeholder={
                  SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_SOCIAL_WARRANTY_NUMBER
                }
              />
              {errors.socialSecurityNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.socialSecurityNumber}
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
                <span className="text-red-500">*</span>
              </label>
              <input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className={inputClass("address")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.ADDRESS}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
              )}
            </div>
            <div className="space-y-1.5">
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
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.NATIONALITY}
              </label>
              <input
                name="nationality"
                value={formData.nationality || ""}
                onChange={handleChange}
                className={inputClass("nationality")}
              />
              {errors.nationality && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.nationality}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_NAME}
              </label>
              <input
                name="emergencyContactName"
                value={formData.emergencyContactName || ""}
                onChange={handleChange}
                className={inputClass("emergencyContactName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.EMERGENCY_NAME}
              />
              {errors.emergencyContactName && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergencyContactName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_PHONE}
              </label>
              <input
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone || ""}
                onChange={handleChange}
                className={inputClass("emergencyContactPhone")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.PHONE}
              />
              {errors.emergencyContactPhone && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.emergencyContactPhone}
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
              {attachments.map((file) => (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className="flex justify-between items-center p-3 bg-muted/40 border border-border rounded-xl text-sm"
                >
                  <span className="truncate max-w-[200px] text-foreground font-medium">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveAttachment?.(attachments.indexOf(file))
                    }
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
            name="avatarUrl"
            placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.FIRST_NAME}
            value={formData.avatarUrl || ""}
            onChange={handleChange}
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
                <span className="text-red-500">*</span>
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
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
                  {errors.departmentId}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.POSITION}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
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
                <p className="text-xs text-red-500 mt-1">{errors.positionId}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_TYPE}
              </label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border outline-none text-sm font-bold bg-card transition-all focus:ring-2 focus:ring-primary/20"
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
                    name="contractDurationMonths"
                    value={formData.contractDurationMonths ?? 12}
                    onChange={handleChange}
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
                      {errors.contractDurationMonths}
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
                    name="contractStartDate"
                    value={formData.contractStartDate || ""}
                    onChange={handleChange}
                    className={inputClass("contractStartDate")}
                  />
                  {errors.contractStartDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.contractStartDate}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.HIRE_DATE}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate || ""}
                onChange={handleChange}
                className={inputClass("hireDate")}
              />
              {errors.hireDate && (
                <p className="text-xs text-red-500 mt-1">{errors.hireDate}</p>
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
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <select
                  name="reportingManagerId"
                  value={formData.reportingManagerId ?? ""}
                  onChange={handleChange}
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
                    {errors.reportingManagerId}
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
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className={
                    inputClass("salary") + " pl-4 pr-12 text-blue-600 font-bold"
                  }
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  {EMPLOYEE_CONSTANTS.LABELS.CURRENCY}
                </span>
              </div>
              {errors.salary && (
                <p className="text-xs text-red-500 mt-1">{errors.salary}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.BANK_NAME}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="bankName"
                value={formData.bankName || ""}
                onChange={handleChange}
                className={inputClass("bankName")}
                placeholder={EMPLOYEE_CONSTANTS.PLACEHOLDERS.BANK_NAME}
              />
              {errors.bankName && (
                <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                {EMPLOYEE_CONSTANTS.LABELS.BANK_ACCOUNT}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                name="bankAccountNumber"
                value={formData.bankAccountNumber || ""}
                onChange={handleChange}
                className={
                  inputClass("bankAccountNumber") +
                  " tracking-widest font-bold font-mono"
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
    </div>
  );
}
