// src/constants/options.ts

export const DEPARTMENT_OPTIONS = {
    DESIGN: "Thiết kế sản phẩm",
    ENGINEERING: "Kỹ thuật",
    HR: "Nhân sự",
    MARKETING: "Marketing"
} as const;

export const ROLE_OPTIONS = {
    DESIGNER: "Chuyên viên UI/UX",
    FRONTEND: "Kỹ sư Frontend",
    BACKEND: "Kỹ sư Backend",
    MANAGER: "Quản lý sản phẩm"
} as const;

export const CONTRACT_OPTIONS = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    PROBATION: "Hợp đồng thử việc",
    INTERN: "Thực tập sinh"
} as const;

export const WORK_STATUS_OPTIONS = {
    ACTIVE: "Đang làm việc",
    INACTIVE: "Nghỉ việc",
    SUSPENDED: "Đình chỉ"
} as const;

// Types for options
export type DepartmentOption = keyof typeof DEPARTMENT_OPTIONS;
export type RoleOption = keyof typeof ROLE_OPTIONS;
export type ContractOption = keyof typeof CONTRACT_OPTIONS;
export type WorkStatusOption = keyof typeof WORK_STATUS_OPTIONS;

export const INCIDENT_STATUS_OPTIONS = [
    { value: "All", label: "Tất cả" },
    { value: "Pending", label: "Chờ duyệt" },
    { value: "Approved", label: "Đã duyệt" },
    { value: "Rejected", label: "Từ chối" }
];

export const ASSET_STATUS_MAP = {
    'Sẵn dùng': { label: 'Sẵn dùng', className: 'status-badge bg-green-100 text-green-700' },
    'Đang cấp phát': { label: 'Đang cấp phát', className: 'status-badge bg-blue-100 text-blue-700' },
    'Đã thu hồi': { label: 'Đã thu hồi', className: 'status-badge bg-yellow-100 text-yellow-700' }
} as const;

export const EMPLOYEE_STATUS_MAP = {
    'Hoạt động': { label: 'Hoạt động', className: 'status-badge bg-green-100 text-green-600' },
    'Không hoạt động': { label: 'Không hoạt động', className: 'status-badge bg-gray-100 text-gray-600' },
    'Chưa xác định': { label: 'Chưa xác định', className: 'status-badge bg-yellow-100 text-yellow-600' }
} as const;

export const ATTENDANCE_STATUS = {
    PRESENT: { label: 'Có mặt', cls: 'status-badge bg-green-500/10 text-green-600 border border-green-500/20' },
    ABSENT: { label: 'Vắng mặt', cls: 'status-badge bg-red-500/10 text-red-600 border border-red-500/20' },
    HALF_DAY: { label: 'Nửa ngày', cls: 'status-badge bg-blue-500/10 text-blue-600 border border-blue-500/20' },
    ON_LEAVE: { label: 'Nghỉ phép', cls: 'status-badge bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' },
    LATE: { label: 'Muộn', cls: 'status-badge bg-orange-500/10 text-orange-600 border border-orange-500/20' },
    DEFAULT: { label: 'Không xác định', cls: 'status-badge bg-gray-500/10 text-gray-600 border border-gray-500/20' }
} as const;

export const LEAVE_TYPE_MANAGER = {
    ANNUAL: { label: 'Nghỉ phép năm', cls: 'status-badge bg-blue-100 text-blue-700 hover:bg-blue-100' },
    SICK: { label: 'Nghỉ ốm', cls: 'status-badge bg-red-100 text-red-700 hover:bg-red-100' },
    UNPAID: { label: 'Nghỉ không lương', cls: 'status-badge bg-slate-100 text-slate-700 hover:bg-slate-100' },
    PERSONAL: { label: 'Nghỉ cá nhân', cls: 'status-badge bg-violet-100 text-violet-700 hover:bg-violet-100' },
} as const;

export const ASSET_CONDITION = {
    NEW: { label: 'Mới', cls: 'status-badge bg-green-100 text-green-700' },
    GOOD: { label: 'Tốt', cls: 'status-badge bg-blue-100 text-blue-700' },
    FAIR: { label: 'Trung bình', cls: 'status-badge bg-yellow-100 text-yellow-700' },
    NEED_REPAIR: { label: 'Cần sửa chữa', cls: 'status-badge bg-red-100 text-red-700' },
    DEFAULT: { label: 'Không xác định', cls: 'status-badge bg-gray-100 text-gray-700' }
} as const;

export const ASSET_GROUP_STATUS = {
    NEW: { label: 'Mới', cls: 'status-badge bg-blue-100 text-blue-700 hover:bg-blue-100' },
    NORMAL: { label: 'Bình thường', cls: 'status-badge bg-green-100 text-green-700 hover:bg-green-100' },
    MAINTENANCE: { label: 'Bảo trì', cls: 'status-badge bg-red-100 text-red-700 hover:bg-red-100' },
} as const;

export const CHECKIN_STATUS = {
    CHECKED_IN: { label: 'Đã checkin', cls: 'status-badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    NOT_CHECKED_IN: { label: 'Chưa checkin', cls: 'status-badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    ON_LEAVE: { label: 'Nghỉ phép', cls: 'status-badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
} as const;

export const APPROVE_STATUS = {
    APPROVED: { label: 'Đã duyệt', cls: 'status-badge bg-green-100 text-green-600' },
    REJECTED: { label: 'Từ chối', cls: 'status-badge bg-red-100 text-red-600' },
    PENDING: { label: 'Chờ duyệt', cls: 'status-badge bg-yellow-100 text-yellow-600' },
} as const;
