// src/constants/theme.ts

export const THEME_CLASSES = {
    CONTRACT: {
        FULL_TIME: 'bg-green-100 text-green-700',
        PART_TIME: 'bg-blue-100 text-blue-700',
        CONTRACT: 'bg-yellow-100 text-yellow-700',
        INTERN: 'bg-purple-100 text-purple-700',
        DEFAULT: 'bg-gray-100 text-gray-700'
    },

    STATUS: {
        ACTIVE: 'bg-green-50 text-green-700 border-green-200',
        INACTIVE: 'bg-gray-50 text-gray-700 border-gray-200',
        SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
        PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        REJECTED: 'bg-red-50 text-red-700 border-red-200',
        RETURNED: 'bg-orange-50 text-orange-700 border-orange-200',
        DEFAULT: 'bg-gray-50 text-gray-700 border-gray-200'
    },

    ASSET_STATUS: {
        AVAILABLE: 'bg-green-100 text-green-700',
        ASSIGNED: 'bg-blue-100 text-blue-700',
        RETURNED: 'bg-yellow-100 text-yellow-700',
        DEFAULT: 'bg-gray-100 text-gray-700'
    },

    BADGE_SIZE: {
        SM: 'px-2 py-0.5 text-[10px]',
        MD: 'px-3 py-1 text-xs',
        LG: 'px-4 py-1.5 text-sm'
    },

    BUTTON_VARIANTS: {
        PRIMARY: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
        SECONDARY: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        OUTLINE: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        GHOST: 'hover:bg-accent hover:text-accent-foreground',
        DESTRUCTIVE: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    },

    CARD_STYLES: {
        DEFAULT: 'bg-white dark:bg-gray-900 rounded-2xl border shadow-sm',
        ELEVATED: 'bg-white dark:bg-gray-900 rounded-2xl border shadow-md',
        FLAT: 'bg-white dark:bg-gray-900 rounded-xl border-0 shadow-none'
    },

    INPUT_STYLES: {
        DEFAULT: 'bg-slate-50 border-slate-200 rounded-md text-sm focus:ring-primary focus:border-primary',
        SEARCH: 'pl-9 h-9 w-full text-sm bg-background border-input',
        READONLY: 'bg-gray-50/50 focus-visible:ring-0 disabled:opacity-100'
    },

    TABLE_STYLES: {
        HEADER: 'bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase text-xs',
        ROW: 'border-t hover:bg-gray-50 dark:hover:bg-gray-800 transition',
        CELL: 'px-6 py-4'
    },

    PAGINATION: {
        BUTTON_ACTIVE: 'w-8 h-8 rounded-full bg-primary text-white font-bold',
        BUTTON_INACTIVE: 'w-8 h-8 rounded-full hover:bg-gray-200'
    }
} as const;

export const ASSET_STATUS_MAP = {
    'Sẵn dùng': { label: 'Sẵn dùng', className: THEME_CLASSES.ASSET_STATUS.AVAILABLE },
    'Đang cấp phát': { label: 'Đang cấp phát', className: THEME_CLASSES.ASSET_STATUS.ASSIGNED },
    'Đã thu hồi': { label: 'Đã thu hồi', className: THEME_CLASSES.ASSET_STATUS.RETURNED }
} as const;

export const EMPLOYEE_STATUS_MAP = {
    'Hoạt động': { label: 'Hoạt động', className: 'bg-green-100 text-green-600' },
    'Không hoạt động': { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-600' },
    'Chưa xác định': { label: 'Chưa xác định', className: 'bg-yellow-100 text-yellow-600' }
} as const;

// Attendance Status
export const ATTENDANCE_STATUS = {
    PRESENT: { label: 'Có mặt', cls: 'bg-green-500/10 text-green-600 border-green-500/20' },
    ABSENT: { label: 'Vắng mặt', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
    HALF_DAY: { label: 'Nửa ngày', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    ON_LEAVE: { label: 'Nghỉ phép', cls: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    LATE: { label: 'Muộn', cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    DEFAULT: { label: 'Không xác định', cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
} as const;

// Leave Request Types (Manager View)
export const LEAVE_TYPE_MANAGER = {
    ANNUAL: { label: 'Nghỉ phép năm', cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    SICK: { label: 'Nghỉ ốm', cls: 'bg-red-100 text-red-700 hover:bg-red-100' },
    UNPAID: { label: 'Nghỉ không lương', cls: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
    PERSONAL: { label: 'Nghỉ cá nhân', cls: 'bg-violet-100 text-violet-700 hover:bg-violet-100' },
} as const;

// Asset Conditions
export const ASSET_CONDITION = {
    NEW: { label: 'Mới', cls: 'bg-green-100 text-green-700' },
    GOOD: { label: 'Tốt', cls: 'bg-blue-100 text-blue-700' },
    FAIR: { label: 'Trung bình', cls: 'bg-yellow-100 text-yellow-700' },
    NEED_REPAIR: { label: 'Cần sửa chữa', cls: 'bg-red-100 text-red-700' },
    DEFAULT: { label: 'Không xác định', cls: 'bg-gray-100 text-gray-700' }
} as const;

// Asset Group Status
export const ASSET_GROUP_STATUS = {
    NEW: { label: 'Mới', cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    NORMAL: { label: 'Bình thường', cls: 'bg-green-100 text-green-700 hover:bg-green-100' },
    MAINTENANCE: { label: 'Bảo trì', cls: 'bg-red-100 text-red-700 hover:bg-red-100' },
} as const;

// Checkin Status
export const CHECKIN_STATUS = {
    CHECKED_IN: { label: 'Đã checkin', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    NOT_CHECKED_IN: { label: 'Chưa checkin', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    ON_LEAVE: { label: 'Nghỉ phép', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
} as const;

// Approve Status Colors
export const APPROVE_STATUS = {
    APPROVED: { label: 'Đã duyệt', cls: 'bg-green-100 text-green-600' },
    REJECTED: { label: 'Từ chối', cls: 'bg-red-100 text-red-600' },
    PENDING: { label: 'Chờ duyệt', cls: 'bg-yellow-100 text-yellow-600' },
} as const;
