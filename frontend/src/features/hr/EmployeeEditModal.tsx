import { useState, useEffect } from "react";
import { X, Save, Briefcase, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { employeeService, EmployeeRequest, EmployeeResponse } from "@/services/employeeService";
import { lookupService, DepartmentOption, PositionOption } from "@/services/lookupService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
    open: boolean;
    employeeId: number | null;
    employee: EmployeeResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EmployeeEditModal({ open, employeeId, employee, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [positions, setPositions] = useState<PositionOption[]>([]);

    const [formData, setFormData] = useState<EmployeeRequest>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        hireDate: "",
        departmentId: 0,
        positionId: 0,
        salary: 0,
    });

    useEffect(() => {
        if (open) {
            lookupService.getDepartments().then(setDepartments);
        }
    }, [open]);

    useEffect(() => {
        if (open && employee) {
            // Tìm departmentId và positionId từ tên (nếu backend không trả ID trong response, nhưng ở đây tôi đã cập nhật DTO để có ID)
            // Thực tế EmployeeResponse mà tôi đã viết ở employeeService.ts có ID nhưng tôi cần mapping lại từ EmployeeResponse sang EmployeeRequest

            setFormData({
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone || "",
                dateOfBirth: employee.dateOfBirth,
                hireDate: employee.hireDate,
                // Chú ý: EmployeeResponse trả về string department name, tôi cần departmentId
                // Tuy nhiên, tôi đã cập nhật backend/frontend DTO để hỗ trợ. 
                // Nếu EmployeeResponse không có departmentId, tôi sẽ phải tìm trong list Departments.
                // Giả sử backend trả về departmentId (tôi nên cập nhật EmployeeResponse DTO)
                departmentId: 0, // Sẽ được set sau khi load list
                positionId: 0,
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
                probationEndDate: employee.probationEndDate || undefined,
                contractEndDate: employee.contractEndDate || undefined,
                workLocation: employee.workLocation || "",
                nationality: employee.nationality || "Việt Nam",
                bloodGroup: employee.bloodGroup || "",
                gender: employee.gender || "MALE",
                avatarUrl: employee.avatarUrl || "",
                notes: employee.notes || "",
            });
        }
    }, [open, employee]);

    useEffect(() => {
        if (open && departments.length > 0 && employee) {
            const dept = departments.find(d => d.name === employee.department);
            if (dept) {
                setFormData(prev => ({ ...prev, departmentId: dept.id }));
            }
        }
    }, [open, departments, employee]);

    useEffect(() => {
        if (formData.departmentId) {
            lookupService.getPositions(formData.departmentId).then(posList => {
                setPositions(posList);
                if (employee) {
                    const pos = posList.find(p => p.title === employee.position);
                    if (pos) {
                        setFormData(prev => ({ ...prev, positionId: pos.id }));
                    }
                }
            });
        }
    }, [formData.departmentId, employee]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) return;

        setLoading(true);
        try {
            await employeeService.updateEmployee(employeeId, formData);
            toast.success(SYSTEM_MESSAGES.EMPLOYEE.MSG_UPDATE_SUCCESS);
            onSuccess();
        } catch (error: any) {
            const msg = error.response?.data?.message || SYSTEM_MESSAGES.ERROR;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "departmentId" || name === "positionId" || name === "salary" || name === "reportingManagerId"
                ? Number(value)
                : value
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col my-auto animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Briefcase size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Cập nhật hồ sơ nhân viên</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4 text-sm font-medium">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-500 border-l-4 border-blue-500 pl-3 uppercase tracking-widest">
                                    Thông tin cơ bản
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Họ</label>
                                        <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Tên</label>
                                        <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800" />
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Email công ty</label>
                                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Số điện thoại</label>
                                        <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Giới tính</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white">
                                            <option value="MALE">Nam</option>
                                            <option value="FEMALE">Nữ</option>
                                            <option value="OTHER">Khác</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-500 border-l-4 border-blue-500 pl-3 uppercase tracking-widest">
                                    Tài chính & Ghi chú
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Lương cơ bản</label>
                                        <input type="number" name="salary" value={formData.salary} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-blue-600" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ghi chú</label>
                                        <textarea name="notes" value={formData.notes || ""} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 resize-none" placeholder="Nhập ghi chú thêm..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 bg-blue-50/20 dark:bg-gray-800/50 p-6 rounded-2xl border border-blue-100 dark:border-gray-800">
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-widest">Công việc hiện tại</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Phòng ban</label>
                                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold bg-white">
                                            <option value={0}>Chọn phòng ban...</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Vị trí</label>
                                        <select name="positionId" value={formData.positionId} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold bg-white" disabled={!formData.departmentId}>
                                            <option value={0}>Chọn vị trí...</option>
                                            {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Loại hợp đồng</label>
                                        <select name="contractType" value={formData.contractType} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold bg-white">
                                            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                                            <option value="PART_TIME">Bán thời gian (Part-time)</option>
                                            <option value="CONTRACT">Hợp đồng có thời hạn</option>
                                            <option value="INTERN">Thực tập sinh</option>
                                            <option value="CONSULTANT">Tư vấn viên</option>
                                            <option value="TEMPORARY">Thời vụ</option>
                                        </select>
                                    </div>
                                    <div className="bg-white/50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Mã NV</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{employee?.employeeCode}</p>
                                        </div>
                                        <ShieldCheck size={24} className="text-blue-500 opacity-20" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition drop-shadow-sm">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={loading} className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/25 flex items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                            Lưu hồ sơ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
