import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  CreditCard,
  Building,
  Users,
  Download,
  Loader2,
} from "lucide-react";
import { employeeService, EmployeeResponse } from "@/services/employeeService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
  open: boolean;
  employeeId: number | null;
  onClose: () => void;
}

export default function EmployeeDetailModal({
  open,
  employeeId,
  onClose,
}: Props) {
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (open && employeeId) {
        setLoading(true);
        try {
          const data = await employeeService.getEmployeeById(employeeId);
          setEmployee(data);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEmployee();
  }, [open, employeeId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col transition-all animate-in fade-in zoom-in duration-200">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {SYSTEM_MESSAGES.EMPLOYEE.MODAL_DETAIL_TITLE}
              </h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {employee?.employeeCode ?? SYSTEM_MESSAGES.LOADING}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="font-medium animate-pulse">
                {SYSTEM_MESSAGES.EMPLOYEE.LOADING_DETAIL}
              </p>
            </div>
          ) : !employee ? (
            <div className="text-center py-20 text-gray-400">
              {SYSTEM_MESSAGES.NO_DATA}
            </div>
          ) : (
            <>
              {/* TOP SECTION: PROFILE SUMMARY */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border-4 border-white dark:border-gray-800 shadow-lg relative group">
                  {employee.avatarUrl ? (
                    <img
                      src={employee.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800 font-bold text-4xl">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="text-white p-2 hover:bg-white/20 rounded-full transition">
                      <Download size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                          {employee.position}
                        </span>
                        <span className="text-gray-400 text-xs font-medium">
                          •
                        </span>
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                          {SYSTEM_MESSAGES.LABEL_DEPARTMENT}
                          {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                          {employee.department}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2 ${
                        employee.status === "ACTIVE"
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${employee.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                      />
                      {employee.status === "ACTIVE"
                        ? SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE_CAP
                        : SYSTEM_MESSAGES.EMPLOYEE.STATUS_INACTIVE_CAP}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Mail size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {employee.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {employee.phone ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold leading-tight">
                          {SYSTEM_MESSAGES.EMPLOYEE.LABEL_JOIN_DATE}
                        </p>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {employee.hireDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {employee.workLocation ??
                          SYSTEM_MESSAGES.EMPLOYEE.DEFAULT_WORK_LOCATION}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PERSONAL INFO */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-primary pl-3 uppercase tracking-wider">
                    <User size={16} />{" "}
                    {SYSTEM_MESSAGES.EMPLOYEE.SECTION_PERSONAL}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_DOB}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.dateOfBirth}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_GENDER}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.gender === "MALE"
                          ? SYSTEM_MESSAGES.EMPLOYEE.GENDER_MALE
                          : employee.gender === "FEMALE"
                            ? SYSTEM_MESSAGES.EMPLOYEE.GENDER_FEMALE
                            : employee.gender === "OTHER"
                              ? SYSTEM_MESSAGES.EMPLOYEE.GENDER_OTHER
                              : (employee.gender ??
                                SYSTEM_MESSAGES.COMMON.EMPTY_VALUE)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.nationalId ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONALITY}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.nationality ??
                          SYSTEM_MESSAGES.EMPLOYEE.DEFAULT_NATIONALITY}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.address
                          ? `${employee.address}, ${employee.city ?? ""}, ${employee.state ?? ""}`
                          : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMPLOYMENT INFO */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                    <Briefcase size={16} />{" "}
                    {SYSTEM_MESSAGES.EMPLOYEE.SECTION_JOB}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_CONTRACT}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.contractType === "FULL_TIME"
                          ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.FULL_TIME
                          : employee.contractType === "PART_TIME"
                            ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.PART_TIME
                            : employee.contractType === "CONTRACT"
                              ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.CONTRACT
                              : employee.contractType === "INTERN"
                                ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES.INTERN
                                : employee.contractType === "CONSULTANT"
                                  ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES
                                      .CONSULTANT
                                  : employee.contractType === "TEMPORARY"
                                    ? SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_TYPES
                                        .TEMPORARY
                                    : (employee.contractType ??
                                      SYSTEM_MESSAGES.COMMON.EMPTY_VALUE)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_SALARY}
                      </p>
                      <p className="text-sm font-bold text-blue-600">
                        {employee.salary
                          ? employee.salary.toLocaleString() +
                            SYSTEM_MESSAGES.COMMON.CURRENCY_VND
                          : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_MANAGER}
                      </p>
                      <p className="text-sm font-semibold flex items-center gap-1.5 underline decoration-gray-200 cursor-help">
                        {employee.reportingManagerName ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_PROBATION_END}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.probationEndDate ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_LEAVE_ANNUAL}
                      </p>
                      <p className="text-sm font-bold text-green-600">
                        {employee.annualLeaveBalance ?? 0}{" "}
                        {SYSTEM_MESSAGES.COMMON.DAYS_UNIT}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_LEAVE_SICK}
                      </p>
                      <p className="text-sm font-bold text-amber-600">
                        {employee.sickLeaveBalance ?? 0}{" "}
                        {SYSTEM_MESSAGES.COMMON.DAYS_UNIT}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMERGENCY CONTACT */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-red-500 pl-3 uppercase tracking-wider">
                    <Users size={16} />{" "}
                    {SYSTEM_MESSAGES.EMPLOYEE.SECTION_EMERGENCY}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMERGENCY_NAME}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.emergencyContactName ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {employee.emergencyContactPhone ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TAX & BANKING */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-amber-500 pl-3 uppercase tracking-wider">
                    <CreditCard size={16} />{" "}
                    {SYSTEM_MESSAGES.EMPLOYEE.SECTION_FINANCE}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_SOCIAL_ID}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.socialSecurityNumber ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">
                        {SYSTEM_MESSAGES.EMPLOYEE.LABEL_BANK_ACCOUNT}
                      </p>
                      <p className="text-sm font-bold flex items-center gap-2 uppercase">
                        <Building size={14} className="text-gray-400" />
                        {employee.bankName}
                        {SYSTEM_MESSAGES.SYMBOLS.DASH}
                        {employee.bankAccountNumber ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {SYSTEM_MESSAGES.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
