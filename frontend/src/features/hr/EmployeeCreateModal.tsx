import { useState, useEffect } from "react";
import { X, Save, User, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { employeeService, EmployeeRequest } from "@/services/employeeService";
import { lookupService, DepartmentOption, PositionOption, ManagerOption, MANAGER_LEVEL } from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeCreateModal({ open, onClose, onSuccess }: Props) {
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
        gender: "MALE",
        contractType: "FULL_TIME",
        nationality: "Việt Nam",
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

    // ✅ AFTER formData is declared — safe to access formData.positionId
    const selectedPosition = positions.find(p => p.id === formData.positionId);
    const isManagerPosition = selectedPosition ? selectedPosition.level >= MANAGER_LEVEL : false;

    useEffect(() => {
        if (open) {
            lookupService.getDepartments().then(setDepartments);
            lookupService.getManagers().then(setManagers).catch(() => setManagers([]));
        }
    }, [open]);

    useEffect(() => {
        if (formData.departmentId) {
            setPositionsLoading(true);
            setPositions([]);
            lookupService.getPositions(formData.departmentId)
                .then(setPositions)
                .catch(() => setPositions([]))
                .finally(() => setPositionsLoading(false));
        } else {
            setPositions([]);
        }
    }, [formData.departmentId]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.departmentId === 0 || formData.positionId === 0) {
            toast.error("Vui lòng chọn Phòng ban và Vị trí");
            return;
        }
        if (!formData.dateOfBirth) {
            toast.error("Vui lòng nhập ngày sinh");
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
            emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
            emergencyContactRelation: formData.emergencyContactRelation?.trim() || undefined,
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
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || SYSTEM_MESSAGES.ERROR;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: name === "departmentId" || name === "positionId" || name === "salary"
                    ? Number(value)
                    : name === "reportingManagerId"
                        ? (value === "" ? undefined : Number(value))
                        : value
            };
            // Reset positionId when department changes
            if (name === "departmentId") {
                updated.positionId = 0;
                updated.reportingManagerId = undefined;
            }
            return updated;
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col my-auto transition-all animate-in fade-in zoom-in duration-200">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Thêm nhân viên mới</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* SECTION: PERSONAL */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-primary border-l-4 border-primary pl-3 uppercase tracking-widest">
                                    Thông tin cơ bản
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Họ</label>
                                        <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="VD: Nguyễn Văn" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tên</label>
                                        <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="VD: A" />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Email công ty</label>
                                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="email@company.com" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Số điện thoại</label>
                                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="091xxxxxxx" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Giới tính</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 outline-none transition-all text-sm font-medium bg-white">
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                            <option value="OTHER">Khác</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ngày sinh</label>
                                        <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 outline-none transition-all text-sm font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">CCCD/CMND</label>
                                        <input name="nationalId" value={formData.nationalId} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="12 số" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-500 border-l-4 border-blue-500 pl-3 uppercase tracking-widest">
                                    Địa chỉ & Liên hệ
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Địa chỉ cụ thể</label>
                                        <input name="address" value={formData.address || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="Số nhà, tên đường..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Thành phố</label>
                                        <input name="city" value={formData.city || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="VD: Hà Nội" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Quốc tịch</label>
                                        <input name="nationality" value={formData.nationality || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Liên hệ khẩn cấp</label>
                                        <input name="emergencyContactName" value={formData.emergencyContactName || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="Tên người thân" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">SĐT khẩn cấp</label>
                                        <input name="emergencyContactPhone" value={formData.emergencyContactPhone || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" placeholder="Số điện thoại" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: JOB & FINANCE */}
                        <div className="space-y-8 bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-500 border-l-4 border-indigo-500 pl-3 uppercase tracking-widest">
                                    Công việc
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Phòng ban <span className="text-red-500">*</span></label>
                                        <select required name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold bg-white">
                                            <option value={0}>Chọn phòng ban...</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Vị trí <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            name="positionId"
                                            value={formData.positionId}
                                            onChange={handleChange}
                                            disabled={!formData.departmentId || positionsLoading}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value={0}>
                                                {!formData.departmentId
                                                    ? "— Chọn phòng ban trước —"
                                                    : positionsLoading
                                                        ? "Đang tải vị trí..."
                                                        : positions.length === 0
                                                            ? "Không có vị trí trong phòng ban này"
                                                            : "Chọn vị trí..."}
                                            </option>
                                            {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                        {!formData.departmentId && (
                                            <p className="text-[10px] text-gray-400 italic">Chọn phòng ban để xem danh sách vị trí</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Hợp đồng</label>
                                        <select name="contractType" value={formData.contractType} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold bg-white">
                                            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                                            <option value="PART_TIME">Bán thời gian (Part-time)</option>
                                            <option value="CONTRACT">Hợp đồng có thời hạn</option>
                                            <option value="INTERN">Thực tập sinh</option>
                                            <option value="CONSULTANT">Tư vấn viên</option>
                                            <option value="TEMPORARY">Thời vụ</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ngày vào làm</label>
                                        <input required type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-medium" />
                                    </div>

                                    {/* Reporting Manager — chỉ hiện khi vị trí KHÔNG phải manager */}
                                    {!isManagerPosition && (
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                                Người quản lý trực tiếp
                                                {!formData.positionId && (
                                                    <span className="text-[10px] font-normal text-gray-400 italic normal-case">(chọn vị trí trước)</span>
                                                )}
                                            </label>
                                            <select
                                                name="reportingManagerId"
                                                value={formData.reportingManagerId ?? ""}
                                                onChange={handleChange}
                                                disabled={!formData.positionId}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-medium bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">— Không chỉ định —</option>
                                                {managers.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name} {m.position ? `(${m.position})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            {managers.length === 0 && formData.positionId > 0 && (
                                                <p className="text-[10px] text-amber-500 italic">Chưa có trưởng phòng nào trong hệ thống</p>
                                            )}
                                        </div>
                                    )}
                                    {isManagerPosition && (
                                        <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                            <Info size={14} className="text-blue-500 flex-shrink-0" />
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Vị trí này là <strong>Trưởng phòng</strong> — không cần chỉ định người quản lý trực tiếp.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-500 border-l-4 border-amber-500 pl-3 uppercase tracking-widest">
                                    Tài chính
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Lương cơ bản (Gross)</label>
                                        <div className="relative">
                                            <input type="number" name="salary" value={formData.salary} onChange={handleChange} className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold text-blue-600" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">VNĐ</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ngân hàng</label>
                                        <input name="bankName" value={formData.bankName || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-medium" placeholder="VD: Vietcombank" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Số tài khoản</label>
                                        <input name="bankAccountNumber" value={formData.bankAccountNumber || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none text-sm font-bold tracking-widest" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AVATAR & NOTES */}
                        {/* ... simplified for now ... */}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Info size={14} /> Hệ thống sẽ tự động tạo Mã nhân viên dựa trên phòng ban.
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition drop-shadow-sm">
                                Bỏ qua
                            </button>
                            <button type="submit" disabled={loading} className="px-8 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/25 flex items-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                Tạo nhân viên
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
