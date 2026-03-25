package com.company.ems.backend.common.constant;

public final class RoleAuthorization {

        private RoleAuthorization() {
        }

        public static final String HAS_ANY = "hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')";

        public static final String HAS_MANAGER_OR_ABOVE = "hasAnyRole('MANAGER','HR','ADMIN')";

        public static final String HAS_HR_OR_ADMIN = "hasAnyRole('HR','ADMIN')";

        public static final String HAS_ADMIN_ONLY = "hasRole('ADMIN')";
        public static final String HAS_HR_ONLY = "hasRole('HR')";
        public static final String HAS_PERM_ASSET_MANAGE = "hasAuthority('ASSET_MANAGE')";
        public static final String HAS_PERM_SYSTEM_CONFIG_MANAGE = "hasAuthority('SYSTEM_CONFIG_MANAGE')";

        public static final String HAS_PERM_ATTENDANCE_CHECKIN = "hasAuthority('ATTENDANCE_CHECKIN')";
        public static final String HAS_PERM_ATTENDANCE_READ = "hasAuthority('ATTENDANCE_READ')";

        public static final String HAS_PERM_ADJUSTMENT_REQUEST = "hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST')";
        public static final String HAS_PERM_ADJUSTMENT_APPROVE = "hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')";
        public static final String HAS_PERM_ADJUSTMENT_ADMIN = "hasAuthority('ATTENDANCE_ADJUSTMENT_ADMIN')";
        public static final String HAS_PERM_ADJUSTMENT_ANY = "hasAuthority('ATTENDANCE_ADJUSTMENT_REQUEST') or hasAuthority('ATTENDANCE_ADJUSTMENT_APPROVE')";

        public static final String HAS_PERM_EMPLOYEE_VIEW = "hasAuthority('EMPLOYEE_VIEW')";
        public static final String HAS_PERM_EMPLOYEE_CREATE = "hasAuthority('EMPLOYEE_CREATE')";
        public static final String HAS_PERM_EMPLOYEE_UPDATE = "hasAuthority('EMPLOYEE_UPDATE')";
        public static final String HAS_PERM_EMPLOYEE_DELETE = "hasAuthority('EMPLOYEE_DELETE')";
        public static final String HAS_PERM_EMPLOYEE_IMPORT = "hasAuthority('EMPLOYEE_IMPORT')";
        public static final String HAS_PERM_EMPLOYEE_EXPORT = "hasAuthority('EMPLOYEE_EXPORT')";

        public static final String HAS_PERM_AUDIT_LOG_VIEW = "hasPermission(null, 'AUDIT_LOG_VIEW')";

        public static final String HAS_PERM_LEAVE_VIEW = "hasPermission(null, 'LEAVE_VIEW')";
        public static final String HAS_PERM_LEAVE_CREATE = "hasPermission(null, 'LEAVE_CREATE')";
        public static final String HAS_PERM_LEAVE_APPROVE = "hasPermission(null, 'LEAVE_APPROVE')";
        public static final String HAS_PERM_LEAVE_CANCEL = "hasPermission(null, 'LEAVE_CANCEL')";
        public static final String HAS_PERM_LEAVE_BALANCE_READ = "hasPermission(null, 'LEAVE_VIEW')";
}