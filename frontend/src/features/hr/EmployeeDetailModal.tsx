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
import { EMPLOYEE_CONSTANTS } from "./employee.constants";

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
              <h2 className="text-xl font-bold text-foreground">
                {EMPLOYEE_CONSTANTS.TITLE_DETAIL}
              </h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {employee?.employeeCode ?? SYSTEM_MESSAGES.LOADING}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
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
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted font-bold text-4xl">
                      {employee.firstName?.[0]}
                      {employee.lastName?.[0]}
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
                      <h3 className="text-2xl font-bold text-foreground uppercase">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                          {employee.position}
                        </span>
                        <span className="text-muted-foreground text-xs font-medium">
                          •
                        </span>
                        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                          {EMPLOYEE_CONSTANTS.LABELS.DEPARTMENT}
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
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail size={16} className="text-muted-foreground/60" />
                      <span className="font-medium text-foreground">
                        {employee.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone size={16} className="text-muted-foreground/60" />
                      <span className="font-medium text-foreground">
                        {employee.phone ?? SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar
                        size={16}
                        className="text-muted-foreground/60"
                      />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold leading-tight">
                          {EMPLOYEE_CONSTANTS.LABELS.HIRE_DATE}
                        </p>
                        <span className="font-medium text-foreground">
                          {employee.hireDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin size={16} className="text-muted-foreground/60" />
                      <span className="font-medium text-foreground">
                        {employee.workLocation ??
                          EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID SECTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PERSONAL INFO */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-primary pl-3 uppercase tracking-wider">
                    <User size={16} /> {EMPLOYEE_CONSTANTS.SECTIONS.BASIC}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.DOB}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.dateOfBirth}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.GENDER}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.gender === "MALE"
                          ? EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.MALE
                          : employee.gender === "FEMALE"
                            ? EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.FEMALE
                            : employee.gender === "OTHER"
                              ? EMPLOYEE_CONSTANTS.LABELS.GENDER_OPTIONS.OTHER
                              : (employee.gender ??
                                SYSTEM_MESSAGES.COMMON.EMPTY_VALUE)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.NATIONAL_ID}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.nationalId ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.NATIONALITY}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.nationality ??
                          EMPLOYEE_CONSTANTS.PLACEHOLDERS.NATIONALITY}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.ADDRESS}
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
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                    <Briefcase size={16} /> {EMPLOYEE_CONSTANTS.SECTIONS.JOB}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.CONTRACT_TYPE}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.contractType === "FULL_TIME"
                          ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS.FULL_TIME
                          : employee.contractType === "PART_TIME"
                            ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS
                                .PART_TIME
                            : employee.contractType === "CONTRACT"
                              ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS
                                  .CONTRACT
                              : employee.contractType === "INTERN"
                                ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS
                                    .INTERN
                                : employee.contractType === "CONSULTANT"
                                  ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS
                                      .CONSULTANT
                                  : employee.contractType === "TEMPORARY"
                                    ? EMPLOYEE_CONSTANTS.LABELS.CONTRACT_OPTIONS
                                        .TEMPORARY
                                    : (employee.contractType ??
                                      SYSTEM_MESSAGES.COMMON.EMPTY_VALUE)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.SALARY}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {employee.salary
                          ? employee.salary.toLocaleString() +
                            SYSTEM_MESSAGES.COMMON.CURRENCY_VND
                          : SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.MANAGER}
                      </p>
                      <p className="text-sm font-semibold flex items-center gap-1.5 underline decoration-border cursor-help">
                        {employee.reportingManagerName ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.HIRE_DATE}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.hireDate ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.ANNUAL_LEAVE}
                      </p>
                      <p className="text-sm font-bold text-green-600">
                        {employee.annualLeaveBalance ?? 0}
                        {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                        {SYSTEM_MESSAGES.COMMON.DAYS_UNIT}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.SICK_LEAVE}
                      </p>
                      <p className="text-sm font-bold text-amber-600">
                        {employee.sickLeaveBalance ?? 0}
                        {SYSTEM_MESSAGES.SYMBOLS.SPACE}
                        {SYSTEM_MESSAGES.COMMON.DAYS_UNIT}
                      </p>
                    </div>
                  </div>
                </div>

                {/* EMERGENCY CONTACT */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-red-500 pl-3 uppercase tracking-wider">
                    <Users size={16} />{" "}
                    {EMPLOYEE_CONSTANTS.SECTIONS.CONTACT_ADDRESS}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.EMERGENCY_NAME}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.emergencyContactName ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.PHONE}
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
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground border-l-4 border-amber-500 pl-3 uppercase tracking-wider">
                    <CreditCard size={16} />{" "}
                    {EMPLOYEE_CONSTANTS.SECTIONS.FINANCE}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.NATIONALITY}
                      </p>
                      <p className="text-sm font-semibold">
                        {employee.socialSecurityNumber ??
                          SYSTEM_MESSAGES.COMMON.EMPTY_VALUE}
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-border pt-3 mt-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {EMPLOYEE_CONSTANTS.LABELS.BANK_ACCOUNT}
                      </p>
                      <p className="text-sm font-bold flex items-center gap-2 uppercase">
                        <Building size={14} className="text-muted-foreground" />
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
        <div className="px-6 py-4 border-t border-border flex justify-end bg-card">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-card border border-border text-foreground rounded-xl font-semibold hover:bg-muted transition active:scale-95"
          >
            {SYSTEM_MESSAGES.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
