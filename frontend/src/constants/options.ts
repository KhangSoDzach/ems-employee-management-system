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
