package com.company.ems.backend.rbac.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;

public interface DataScopeService {

    /**
     * @param principal     CustomUserPrincipal của user đang đăng nhập
     * @param targetEmpId   ID của Employee cần kiểm tra quyền truy cập
     * @return true nếu được phép truy cập
     */
    void assertCanAccessEmployee(CustomUserPrincipal principal, Long targetEmpId);

    /**
     * @param principal     CustomUserPrincipal của user đang đăng nhập
     * @param leaveId       ID của Leave request
     */
    void assertCanAccessLeave(CustomUserPrincipal principal, Long leaveId);

    /**
     * @param principal     CustomUserPrincipal của user đang đăng nhập
     * @param leaveId       ID của Leave request cần approve
     */
    void assertCanApproveLeave(CustomUserPrincipal principal, Long leaveId);

    /**
     * @return CustomUserPrincipal của user đang đăng nhập
     */
    CustomUserPrincipal getCurrentPrincipal();
}