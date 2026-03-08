import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { differenceInYears } from "date-fns";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { SYSTEM_MESSAGES } from "@/constants/messages";
import { EMPLOYEE_STATUS_MAP } from "@/constants/theme";
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
/* ====== CARD ========== */
/* ====================== */

interface EmployeeCardProps {
    name: string;
    code: string;
    status: string;
    statusColor: string;
    avatar?: string;
    id: string | number;
    email: string;
    phone: string;
    onEdit?: () => void;
}

function EmployeeCard({
    name,
    code,
    status,
    statusColor,
    avatar,
    id,
    email,
    phone,
    onEdit,
}: EmployeeCardProps) {
    return (
        <div className="item-card">
            <div className="item-card-header">
                <div className="flex items-center gap-3">
                    <div className="avatar-medium">
                        {avatar ? (
                            <img src={avatar} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-xl font-bold">
                                {name.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{name}</h3>
                        <p className="text-xs text-primary font-medium">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMP_CODE}: {code}</p>

                        <button
                            onClick={onEdit}
                            className="mt-2 text-xs text-blue-600 hover:underline font-medium"
                        >
                            ✏ {SYSTEM_MESSAGES.BTN_EDIT}
                        </button>
                    </div>
                </div>

                <span
                    className={`status-badge-pill ${statusColor}`}
                >
                    {status}
                </span>
            </div>

            <div className="item-card-body">
                <div>{SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMP_CODE}: {id}</div>
                <div className="truncate">{SYSTEM_MESSAGES.EMPLOYEE.LABEL_EMAIL}: {email}</div>
                <div>{SYSTEM_MESSAGES.EMPLOYEE.LABEL_PHONE}: {phone}</div>
            </div>
        </div>
    );
}

/* ====================== */
/* ====== PAGE ========== */
/* ====================== */

export default function Page() {
    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] =
        useState<EmployeeCardProps | null>(null);

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        mode: "onChange",
    });

    useEffect(() => {
        if (selectedEmployee) {
            form.reset({
                fullName: selectedEmployee.name,
                nationalId: String(selectedEmployee.id),
                companyEmail: selectedEmployee.email,
                phoneNumber: selectedEmployee.phone,
                dateOfBirth: "1995-05-15",
            });
        } else {
            form.reset();
        }
    }, [selectedEmployee]);

    function onSubmit(data: EmployeeFormValues) {
        if (selectedEmployee) {
            console.log("Updated employee:", data);
            alert(SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_SUCCESS);
        } else {
            console.log("Created employee:", data);
            alert(SYSTEM_MESSAGES.EMPLOYEE.MSG_CREATE_SUCCESS);
        }

        setOpen(false);
        setSelectedEmployee(null);
        form.reset();
    }

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />

                <main className="page-layout-main">
                    <div className="page-header">
                        <h1 className="page-title">{SYSTEM_MESSAGES.EMPLOYEE.TITLE}</h1>

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

                    <div className="space-y-4">
                        <EmployeeCard
                            name="Nguyễn Văn An"
                            code="NV001"
                            status={SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE}
                            statusColor={EMPLOYEE_STATUS_MAP['Hoạt động'].className}
                            id="123456789012"
                            email="an.nguyen@company.vn"
                            phone="0912345678"
                            onEdit={() => {
                                setSelectedEmployee({
                                    name: "Nguyễn Văn An",
                                    code: "NV001",
                                    status: SYSTEM_MESSAGES.EMPLOYEE.STATUS_ACTIVE,
                                    statusColor: EMPLOYEE_STATUS_MAP['Hoạt động'].className,
                                    id: "123456789012",
                                    email: "an.nguyen@company.vn",
                                    phone: "0912345678",
                                });
                                setOpen(true);
                            }}
                        />
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
                                        <span className="material-symbols-outlined">close</span>
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
                                                        person
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
                                                                photo_camera
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
                                                            {selectedEmployee?.status || SYSTEM_MESSAGES.EMPLOYEE.STATUS_PENDING}
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
                                                            placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_NATIONAL_ID}
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
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.GENDER_MALE}</option>
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.GENDER_FEMALE}</option>
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.GENDER_OTHER}</option>
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
                                                            placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_ADDRESS}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ================= CỘT 2 ================= */}
                                            <div className="space-y-6">
                                                <div className="section-header">
                                                    <span className="material-symbols-outlined">
                                                        badge
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
                                                            <option>Phòng Phần mềm</option>
                                                            <option>Phòng Nhân sự</option>
                                                            <option>Phòng Kinh doanh</option>
                                                            <option>Ban Giám đốc</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="form-label-required">
                                                            {SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION}
                                                        </label>
                                                        <input
                                                            {...form.register("position")}
                                                            className="form-input"
                                                            placeholder={SYSTEM_MESSAGES.EMPLOYEE.LABEL_POSITION}
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
                                                            <option>Nguyễn Văn A</option>
                                                            <option>Trần Thị B</option>
                                                            <option>Lê Văn C</option>
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
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_INDEFINITE}</option>
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_ONE_YEAR}</option>
                                                            <option>{SYSTEM_MESSAGES.EMPLOYEE.CONTRACT_PROBATION}</option>
                                                        </select>
                                                    </div>

                                                    {/* Info box */}
                                                    <div className="info-box">
                                                        <div className="info-box-content">
                                                            <span className="material-symbols-outlined info-box-icon">
                                                                info
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
                                        {selectedEmployee ? SYSTEM_MESSAGES.EMPLOYEE.BTN_UPDATE : SYSTEM_MESSAGES.EMPLOYEE.BTN_CREATE}
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
