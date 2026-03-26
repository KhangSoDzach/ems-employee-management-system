import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInYears } from "date-fns";
import {
  employeeService,
  type EmployeeResponse,
} from "@/services/employeeService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import { FORM_VALIDATION_MESSAGES } from "@/constants/validations";

/* ====================== */
/* ====== SCHEMA ======== */
/* ====================== */

const employeeSchema = z.object({
  fullName: z.string().min(2, FORM_VALIDATION_MESSAGES.NAME_MIN),
  nationalId: z
    .string()
    .regex(/^(\d{9}|\d{12})$/, FORM_VALIDATION_MESSAGES.ID_FORMAT),
  companyEmail: z.string().email(FORM_VALIDATION_MESSAGES.EMAIL_INVALID),
  phoneNumber: z
    .string()
    .regex(/^\d{10,13}$/, FORM_VALIDATION_MESSAGES.PHONE_FORMAT),
  dateOfBirth: z
    .string()
    .refine(
      (date) => differenceInYears(new Date(), new Date(date)) >= 18,
      FORM_VALIDATION_MESSAGES.AGE_MIN,
    ),
  gender: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  manager: z.string().optional(),
  joinDate: z.string().optional(),
  endDate: z.string().optional(),
  contractType: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

/* ====================== */
/* ====== PAGE ========== */
/* ====================== */

interface Employee {
  id: number;
  name: string;
  code: string;
  status: string;
  statusColor: string;
  avatar?: string;
  email: string;
  phone: string;
  nationalId: string;
}

export default function Page() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    mode: "onChange",
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAllEmployees({
        page: 0,
        size: 1000,
      });
      const list: Employee[] = res.content.map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        code: emp.employeeCode || `NV-${emp.id}`,
        status:
          emp.status === "ACTIVE"
            ? SYSTEM_MESSAGES.STATUS.ACTIVE
            : SYSTEM_MESSAGES.STATUS.INACTIVE,
        statusColor:
          emp.status === "ACTIVE"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700",
        avatar: emp.avatarUrl || undefined,
        email: emp.email,
        phone: emp.phone || SYSTEM_MESSAGES.SYMBOLS.DASH,
        nationalId: emp.nationalId || SYSTEM_MESSAGES.SYMBOLS.DASH,
      }));
      setEmployees(list);
    } catch (err) {
      toast.error(SYSTEM_MESSAGES.EMPLOYEE.MSG_FETCH_ERROR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      form.reset({
        fullName: selectedEmployee.name,
        nationalId: selectedEmployee.nationalId,
        companyEmail: selectedEmployee.email,
        phoneNumber: selectedEmployee.phone,
        dateOfBirth: "1995-05-15",
      });
    } else {
      form.reset();
    }
  }, [selectedEmployee, form]);

  function onSubmit() {
    // Param is required for signature but unused for now
    if (selectedEmployee) {
      alert(SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_SUCCESS);
    } else {
      alert(SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_SUCCESS);
    }

    setOpen(false);
    setSelectedEmployee(null);
    form.reset();
  }

  return (
    <SidebarProvider>
      <AppSidebar role="hr" variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="page-layout-main">
          <div className="page-header">
            <h1 className="page-heading">{SYSTEM_MESSAGES.EMPLOYEE.TITLE}</h1>

            <button
              onClick={() => {
                setSelectedEmployee(null);
                setOpen(true);
              }}
              className="btn-primary"
            >
              {SYSTEM_MESSAGES.EMPLOYEE.BTN_ADD}
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead className="data-table-header">
                <tr>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NAME}
                  </th>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMP_CODE}
                  </th>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_STATUS}
                  </th>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID}
                  </th>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMAIL}
                  </th>
                  <th className="data-table-header-cell">
                    {SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}
                  </th>
                  <th className="data-table-header-cell text-right">
                    {SYSTEM_MESSAGES.LABEL_ACTION || "Thao tác"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{SYSTEM_MESSAGES.LOADING}</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center text-muted-foreground"
                    >
                      {SYSTEM_MESSAGES.NO_DATA}
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="data-table-row">
                      <td className="data-table-cell">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center text-xs font-bold text-slate-400">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-slate-700">
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="data-table-cell font-mono text-xs">
                        {emp.code}
                      </td>
                      <td className="data-table-cell">
                        <span
                          className={`status-badge-pill ${emp.statusColor}`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="data-table-cell text-slate-500">
                        {emp.nationalId}
                      </td>
                      <td className="data-table-cell text-slate-500">
                        {emp.email}
                      </td>
                      <td className="data-table-cell text-slate-500">
                        {emp.phone}
                      </td>
                      <td className="data-table-cell text-right">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {open && (
            <div className="modal-overlay">
              <div className="modal-content">
                {/* ================= HEADER ================= */}
                <div className="modal-header">
                  <h2 className="modal-title">
                    {selectedEmployee
                      ? SYSTEM_MESSAGES.EMPLOYEE.MODAL_UPDATE_TITLE
                      : SYSTEM_MESSAGES.EMPLOYEE.MODAL_CREATE_TITLE}
                  </h2>

                  <button
                    onClick={() => {
                      setOpen(false);
                      setSelectedEmployee(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {SYSTEM_MESSAGES.SYMBOLS.CLOSE}
                    </span>
                  </button>
                </div>

                {/* ================= BODY ================= */}
                <div className="modal-body">
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* ================= CỘT 1 ================= */}
                      <div className="space-y-6">
                        <div className="section-header">
                          <span className="material-symbols-outlined">
                            {SYSTEM_MESSAGES.SYMBOLS.PERSON}
                          </span>
                          <h3 className="section-header-title">
                            {SYSTEM_MESSAGES.EMPLOYEE.SECTION_PERSONAL}
                          </h3>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative group">
                            <img
                              src={
                                selectedEmployee?.avatar ||
                                "https://i.pravatar.cc/150"
                              }
                              className="size-20 rounded-full ring-2 ring-slate-100 object-cover"
                            />
                            <button
                              type="button"
                              className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white shadow-sm"
                            >
                              <span className="material-symbols-outlined text-xs">
                                {SYSTEM_MESSAGES.SYMBOLS.CAMERA}
                              </span>
                            </button>
                          </div>

                          <div>
                            <div className="form-label-required">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMP_CODE}
                            </div>
                            <div className="font-mono font-bold">
                              {selectedEmployee?.code || "NV--"}
                            </div>

                            <div className="mt-1 inline-flex items-center status-badge-pill bg-green-100 text-green-700">
                              {selectedEmployee?.status ||
                                SYSTEM_MESSAGES.EMPLOYEE.STATUS_PENDING}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NAME}
                            </label>
                            <input
                              {...form.register("fullName")}
                              className="form-input"
                              placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_NAME}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID}
                            </label>
                            <input
                              {...form.register("nationalId")}
                              className="form-input"
                              placeholder={
                                SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_DOB}
                            </label>
                            <input
                              type="date"
                              {...form.register("dateOfBirth")}
                              className="form-input"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_GENDER}
                            </label>
                            <select
                              {...form.register("gender")}
                              className="form-select"
                            >
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.GENDER_MALE}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.GENDER_FEMALE}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.GENDER_OTHER}
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}
                            </label>
                            <input
                              {...form.register("phoneNumber")}
                              className="form-input"
                              placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMAIL}
                            </label>
                            <input
                              {...form.register("companyEmail")}
                              className="form-input"
                              placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMAIL}
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="form-label-secondary">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS}
                            </label>
                            <textarea
                              rows={2}
                              {...form.register("address")}
                              className="form-textarea"
                              placeholder={
                                SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* ================= CỘT 2 ================= */}
                      <div className="space-y-6">
                        <div className="section-header">
                          <span className="material-symbols-outlined">
                            {SYSTEM_MESSAGES.SYMBOLS.BADGE}
                          </span>
                          <h3 className="section-header-title">
                            {SYSTEM_MESSAGES.EMPLOYEE.SECTION_JOB}
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="form-label-required">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_DEPARTMENT}
                            </label>
                            <select
                              {...form.register("department")}
                              className="form-select"
                            >
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.DEPT_SOFTWARE}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.DEPT_HR}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.DEPT_SALES}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.DEPT_BOD}
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-required">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION}
                            </label>
                            <input
                              {...form.register("position")}
                              className="form-input"
                              placeholder={
                                SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-required">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_MANAGER}
                            </label>
                            <select
                              {...form.register("manager")}
                              className="form-select"
                            >
                              <option>{SYSTEM_MESSAGES.EMPLOYEE.MGR_A}</option>
                              <option>{SYSTEM_MESSAGES.EMPLOYEE.MGR_B}</option>
                              <option>{SYSTEM_MESSAGES.EMPLOYEE.MGR_C}</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="form-label-required">
                                {SYSTEM_MESSAGES.EMPLOYEE.LABEL_JOIN_DATE}
                              </label>
                              <input
                                type="date"
                                {...form.register("joinDate")}
                                className="form-input"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="form-label-secondary">
                                {SYSTEM_MESSAGES.EMPLOYEE.LABEL_END_DATE}
                              </label>
                              <input
                                type="date"
                                {...form.register("endDate")}
                                className="form-input"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="form-label-required">
                              {SYSTEM_MESSAGES.EMPLOYEE.LABEL_CONTRACT}
                            </label>
                            <select
                              {...form.register("contractType")}
                              className="form-select"
                            >
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_INDEFINITE}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_ONE_YEAR}
                              </option>
                              <option>
                                {SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_PROBATION}
                              </option>
                            </select>
                          </div>

                          {/* Info box */}
                          <div className="info-box">
                            <div className="info-box-content">
                              <span className="material-symbols-outlined info-box-icon">
                                {SYSTEM_MESSAGES.SYMBOLS.INFO}
                              </span>
                              <p className="info-box-text">
                                {SYSTEM_MESSAGES.EMPLOYEE.INFO_NOTE}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* ================= FOOTER ================= */}
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setSelectedEmployee(null);
                    }}
                    className="btn-secondary"
                  >
                    {SYSTEM_MESSAGES.EMPLOYEE.BTN_CANCEL}
                  </button>

                  <button
                    onClick={form.handleSubmit(onSubmit)}
                    className="btn-action"
                  >
                    {selectedEmployee
                      ? SYSTEM_MESSAGES.EMPLOYEE.BTN_UPDATE
                      : SYSTEM_MESSAGES.EMPLOYEE.BTN_CREATE}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
