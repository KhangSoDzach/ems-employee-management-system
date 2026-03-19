import { Info, User } from "lucide-react";
import { EmployeeRequest } from "@/services/employeeService";
import { DepartmentOption, PositionOption, ManagerOption } from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface EmployeeFormFieldsProps {
    formData: EmployeeRequest;
    errors: Record<string, string>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    departments: DepartmentOption[];
    positions: PositionOption[];
    managers: ManagerOption[];
    positionsLoading: boolean;
    isManagerPosition: boolean;
    inputClass: (field: string) => string;
    selectClass: (field: string) => string;
}

export default function EmployeeFormFields({
    formData,
    errors,
    handleChange,
    departments,
    positions,
    managers,
    positionsLoading,
    isManagerPosition,
    inputClass,
    selectClass
}: EmployeeFormFieldsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* SECTION: PERSONAL */}
            <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-primary border-l-4 border-primary pl-3 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.SECTION_BASIC}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_LAST_NAME} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="lastName"
                                value={formData.lastName || ""}
                                onChange={handleChange}
                                className={inputClass("lastName")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_LAST_NAME}
                            />
                            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_FIRST_NAME} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="firstName"
                                value={formData.firstName || ""}
                                onChange={handleChange}
                                className={inputClass("firstName")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_FIRST_NAME}
                            />
                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_COMP_EMAIL} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email || ""}
                                onChange={handleChange}
                                className={inputClass("email")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_EMAIL}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}</label>
                            <input
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                className={inputClass("phone")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_PHONE}
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_GENDER}</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className={selectClass("gender")}
                            >
                                <option value="MALE">{SYSTEM_MESSAGES.EMPLOYEE.GENDER_MALE}</option>
                                <option value="FEMALE">{SYSTEM_MESSAGES.EMPLOYEE.GENDER_FEMALE}</option>
                                <option value="OTHER">{SYSTEM_MESSAGES.EMPLOYEE.GENDER_OTHER}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_DOB} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth || ""}
                                onChange={handleChange}
                                className={inputClass("dateOfBirth")}
                            />
                            {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="nationalId"
                                value={formData.nationalId || ""}
                                onChange={handleChange}
                                className={inputClass("nationalId")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_NATIONAL_ID}
                            />
                            {errors.nationalId && <p className="text-xs text-red-500 mt-1">{errors.nationalId}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-blue-500 border-l-4 border-blue-500 pl-3 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="address"
                                value={formData.address || ""}
                                onChange={handleChange}
                                className={inputClass("address")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_ADDRESS}
                            />
                            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_CITY}</label>
                            <input
                                name="city"
                                value={formData.city || ""}
                                onChange={handleChange}
                                className={inputClass("city")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_CITY}
                            />
                            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONALITY}</label>
                            <input
                                name="nationality"
                                value={formData.nationality || ""}
                                onChange={handleChange}
                                className={inputClass("nationality")}
                            />
                            {errors.nationality && <p className="text-xs text-red-500 mt-1">{errors.nationality}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.SECTION_EMERGENCY}</label>
                            <input
                                name="emergencyContactName"
                                value={formData.emergencyContactName || ""}
                                onChange={handleChange}
                                className={inputClass("emergencyContactName")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_EMERGENCY_NAME}
                            />
                            {errors.emergencyContactName && <p className="text-xs text-red-500 mt-1">{errors.emergencyContactName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMERGENCY_PHONE}</label>
                            <input
                                name="emergencyContactPhone"
                                value={formData.emergencyContactPhone || ""}
                                onChange={handleChange}
                                className={inputClass("emergencyContactPhone")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_EMERGENCY_PHONE}
                            />
                            {errors.emergencyContactPhone && <p className="text-xs text-red-500 mt-1">{errors.emergencyContactPhone}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: JOB & FINANCE */}
            <div className="space-y-8 bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-500 border-l-4 border-indigo-500 pl-3 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.SECTION_CURRENT_JOB}
                    </h4>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_DEPARTMENT} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <select
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleChange}
                                className={selectClass("departmentId")}
                            >
                                <option value={0}>{SYSTEM_MESSAGES.EMPLOYEE.SELECT_DEPT}</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <select
                                name="positionId"
                                value={formData.positionId}
                                onChange={handleChange}
                                disabled={!formData.departmentId || positionsLoading}
                                className={selectClass("positionId") + " disabled:opacity-50 disabled:cursor-not-allowed"}
                            >
                                <option value={0}>
                                    {!formData.departmentId
                                        ? SYSTEM_MESSAGES.EMPLOYEE.SELECT_DEPT
                                        : positionsLoading
                                            ? SYSTEM_MESSAGES.LOADING
                                            : positions.length === 0
                                                ? SYSTEM_MESSAGES.NO_DATA
                                                : SYSTEM_MESSAGES.EMPLOYEE.SELECT_POSITION}
                                </option>
                                {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                            {!formData.departmentId && (
                                <p className="text-[10px] text-gray-400 italic">{SYSTEM_MESSAGES.EMPLOYEE.HINT_SELECT_DEPT}</p>
                            )}
                            {errors.positionId && <p className="text-xs text-red-500 mt-1">{errors.positionId}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_CONTRACT}</label>
                            <select name="contractType" value={formData.contractType} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold bg-white">
                                <option value="FULL_TIME">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.FULL_TIME}</option>
                                <option value="PART_TIME">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.PART_TIME}</option>
                                <option value="CONTRACT">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.CONTRACT}</option>
                                <option value="INTERN">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.INTERN}</option>
                                <option value="CONSULTANT">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.CONSULTANT}</option>
                                <option value="TEMPORARY">{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.TEMPORARY}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_JOIN_DATE} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                type="date"
                                name="hireDate"
                                value={formData.hireDate || ""}
                                onChange={handleChange}
                                className={inputClass("hireDate")}
                            />
                            {errors.hireDate && <p className="text-xs text-red-500 mt-1">{errors.hireDate}</p>}
                        </div>

                        {!isManagerPosition && (
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_REPORTING_MANAGER}
                                    {!formData.positionId && (
                                        <span className="text-[10px] font-normal text-gray-400 italic normal-case">{SYSTEM_MESSAGES.EMPLOYEE.HINT_CHOOSE_POSITION}</span>
                                    )}
                                </label>
                                <select
                                    name="reportingManagerId"
                                    value={formData.reportingManagerId ?? ""}
                                    onChange={handleChange}
                                    disabled={!formData.positionId}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-medium bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{SYSTEM_MESSAGES.EMPLOYEE.OPTION_NO_MANAGER}</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} {m.position ? `(${m.position})` : ""}
                                        </option>
                                    ))}
                                </select>
                                {managers.length === 0 && formData.positionId > 0 && (
                                    <p className="text-[10px] text-amber-500 italic">{SYSTEM_MESSAGES.EMPLOYEE.MSG_NO_MANAGERS}</p>
                                )}
                            </div>
                        )}
                        {isManagerPosition && (
                            <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                <Info size={14} className="text-blue-500 shrink-0" />
                                <p className="text-xs text-blue-600 dark:text-blue-400">{SYSTEM_MESSAGES.EMPLOYEE.MSG_MANAGER_LEVEL}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-amber-500 border-l-4 border-amber-500 pl-3 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.SECTION_FINANCE_NOTES}
                    </h4>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_SALARY} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    className={inputClass("salary") + " pl-4 pr-12 text-blue-600 font-bold"}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_CURRENCY_VND}</span>
                            </div>
                            {errors.salary && <p className="text-xs text-red-500 mt-1">{errors.salary}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_BANK_NAME} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="bankName"
                                value={formData.bankName || ""}
                                onChange={handleChange}
                                className={inputClass("bankName")}
                                placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_BANK_NAME}
                            />
                            {errors.bankName && <p className="text-xs text-red-500 mt-1">{errors.bankName}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_BANK_ACCOUNT} <span className="text-red-500">{SYSTEM_MESSAGES.EMPLOYEE.TXT_REQUIRED_MARK}</span></label>
                            <input
                                name="bankAccountNumber"
                                value={formData.bankAccountNumber || ""}
                                onChange={handleChange}
                                className={inputClass("bankAccountNumber") + " tracking-widest font-bold"}
                            />
                            {errors.bankAccountNumber && <p className="text-xs text-red-500 mt-1">{errors.bankAccountNumber}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: AVATAR & NOTES */}
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_AVATAR}
                    </h4>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400">
                            <User size={32} />
                            <span className="text-[10px] uppercase font-bold tracking-tighter">Upload</span>
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {SYSTEM_MESSAGES.EMPLOYEE.LABEL_AVATAR_DESC || "Click to upload or drag and drop a professional photo (JPG, PNG)."}
                            </p>
                            <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                                {SYSTEM_MESSAGES.EMPLOYEE.BTN_UPLOAD || "Select File"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NOTES}
                    </h4>
                    <textarea
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 outline-none text-sm bg-gray-50/30 dark:bg-gray-800/20 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        placeholder={SYSTEM_MESSAGES.EMPLOYEE.PLACEHOLDER_NOTES}
                    />
                </div>
            </div>
        </div>
    );
}
