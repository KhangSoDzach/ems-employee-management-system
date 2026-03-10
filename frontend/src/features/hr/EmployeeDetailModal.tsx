import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, MapPin, Briefcase, CreditCard, Building, Users, Download, Loader2 } from "lucide-react";
import { employeeService, EmployeeResponse } from "@/services/employeeService";
import { SYSTEM_MESSAGES } from "@/constants/messages";

interface Props {
    open: boolean;
    employeeId: number | null;
    onClose: () => void;
}

export default function EmployeeDetailModal({ open, employeeId, onClose }: Props) {
    const [employee, setEmployee] = useState<EmployeeResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && employeeId) {
            setLoading(true);
            employeeService.getEmployeeById(employeeId)
                .then(setEmployee)
                .finally(() => setLoading(false));
        }
    }, [open, employeeId]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col transition-all animate-in fade-in zoom-in duration-200">
                {/* HEADER */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết nhân viên</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{employee?.employeeCode ?? "Loading..."}</p>
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
                            <p className="font-medium animate-pulse">Đang tải thông tin nhân viên...</p>
                        </div>
                    ) : !employee ? (
                        <div className="text-center py-20 text-gray-400">Không tìm thấy dữ liệu</div>
                    ) : (
                        <>
                            {/* TOP SECTION: PROFILE SUMMARY */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border-4 border-white dark:border-gray-800 shadow-lg relative group">
                                    {employee.avatarUrl ? (
                                        <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800 font-bold text-4xl">
                                            {employee.firstName[0]}{employee.lastName[0]}
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
                                                <span className="text-gray-400 text-xs font-medium">•</span>
                                                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                                                    Phòng {employee.department}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2 ${employee.status === "ACTIVE"
                                            ? "bg-green-50 text-green-600 border border-green-200"
                                            : "bg-red-50 text-red-600 border border-red-200"
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${employee.status === "ACTIVE" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                                            {employee.status === "ACTIVE" ? "ĐANG LÀM VIỆC" : "NGHỈ VIỆC"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <Mail size={16} className="text-gray-400" />
                                            <span className="font-medium text-gray-900 dark:text-white">{employee.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <Phone size={16} className="text-gray-400" />
                                            <span className="font-medium text-gray-900 dark:text-white">{employee.phone ?? "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <Calendar size={16} className="text-gray-400" />
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold leading-tight">Ngày vào làm</p>
                                                <span className="font-medium text-gray-900 dark:text-white">{employee.hireDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span className="font-medium text-gray-900 dark:text-white">{employee.workLocation ?? "Văn phòng chính"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GRID SECTIONS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* PERSONAL INFO */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-primary pl-3 uppercase tracking-wider">
                                        <User size={16} /> Thông tin cá nhân
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Ngày sinh</p>
                                            <p className="text-sm font-semibold">{employee.dateOfBirth}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Giới tính</p>
                                            <p className="text-sm font-semibold">{employee.gender ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">CMND/CCCD</p>
                                            <p className="text-sm font-semibold">{employee.nationalId ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Quốc tịch</p>
                                            <p className="text-sm font-semibold">{employee.nationality ?? "Việt Nam"}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Địa chỉ</p>
                                            <p className="text-sm font-semibold">{employee.address ? `${employee.address}, ${employee.city ?? ""}, ${employee.state ?? ""}` : "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* EMPLOYMENT INFO */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-blue-500 pl-3 uppercase tracking-wider">
                                        <Briefcase size={16} /> Thông tin công việc
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Loại hợp đồng</p>
                                            <p className="text-sm font-semibold">{
                                                employee.contractType === "FULL_TIME" ? "Toàn thời gian" :
                                                    employee.contractType === "PART_TIME" ? "Bán thời gian" :
                                                        employee.contractType === "CONTRACT" ? "Hợp đồng có thời hạn" :
                                                            employee.contractType === "INTERN" ? "Thực tập sinh" :
                                                                employee.contractType === "CONSULTANT" ? "Tư vấn viên" :
                                                                    employee.contractType === "TEMPORARY" ? "Thời vụ" :
                                                                        employee.contractType ?? "N/A"
                                            }</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Lương cơ bản</p>
                                            <p className="text-sm font-bold text-blue-600">{employee.salary ? employee.salary.toLocaleString() + " VNĐ" : "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Người quản lý</p>
                                            <p className="text-sm font-semibold flex items-center gap-1.5 underline decoration-gray-200 cursor-help">
                                                {employee.reportingManagerName ?? "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Kết thúc thử việc</p>
                                            <p className="text-sm font-semibold">{employee.probationEndDate ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Phép năm tồn</p>
                                            <p className="text-sm font-bold text-green-600">{employee.annualLeaveBalance ?? 0} ngày</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Phép bệnh tồn</p>
                                            <p className="text-sm font-bold text-amber-600">{employee.sickLeaveBalance ?? 0} ngày</p>
                                        </div>
                                    </div>
                                </div>

                                {/* EMERGENCY CONTACT */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-red-500 pl-3 uppercase tracking-wider">
                                        <Users size={16} /> Liên hệ khẩn cấp
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Họ tên</p>
                                            <p className="text-sm font-semibold">{employee.emergencyContactName ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Quan hệ</p>
                                            <p className="text-sm font-semibold">{employee.emergencyContactRelation ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Số điện thoại</p>
                                            <p className="text-sm font-bold text-red-600">{employee.emergencyContactPhone ?? "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* TAX & BANKING */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-l-4 border-amber-500 pl-3 uppercase tracking-wider">
                                        <CreditCard size={16} /> Tài chính & Thuế
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Mã số thuế</p>
                                            <p className="text-sm font-semibold">{employee.taxId ?? "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Số sổ BHXH</p>
                                            <p className="text-sm font-semibold">{employee.socialSecurityNumber ?? "N/A"}</p>
                                        </div>
                                        <div className="col-span-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Tài khoản ngân hàng</p>
                                            <p className="text-sm font-bold flex items-center gap-2 uppercase">
                                                <Building size={14} className="text-gray-400" />
                                                {employee.bankName} - {employee.bankAccountNumber ?? "N/A"}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Chi nhánh: {employee.bankBranch ?? "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* NOTES */}
                            {employee.notes && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white border-l-4 border-gray-400 pl-3 uppercase tracking-wider">
                                        Ghi chú
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                                        "{employee.notes}"
                                    </div>
                                </div>
                            )}
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
