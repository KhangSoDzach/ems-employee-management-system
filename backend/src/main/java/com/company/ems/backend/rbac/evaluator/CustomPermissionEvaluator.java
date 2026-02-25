package com.company.ems.backend.rbac.evaluator;

import java.io.Serializable;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.company.ems.backend.auth.security.CustomUserPrincipal;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CustomPermissionEvaluator implements PermissionEvaluator {

    /**
     * @param authentication
     * @param targetDomainObject
     * @param permission
     * @return
     */
    @Override
    public boolean hasPermission(Authentication authentication,
                                 Object targetDomainObject,
                                 Object permission) {

        // Guard: không có authentication hoặc không được xác thực
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("RBAC DENY: no authentication for permission check [{}]", permission);
            return false;
        }

        // Guard: principal phải là CustomUserPrincipal
        if (!(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            log.warn("RBAC DENY: principal is not CustomUserPrincipal for [{}]", permission);
            return false;
        }

        // Guard: permission phải là String
        if (!(permission instanceof String permissionName)) {
            log.warn("RBAC DENY: permission object is not a String [{}]", permission);
            return false;
        }

        // RBAC check: tìm permission trong authorities của user
        boolean hasPermission = principal.hasPermission(permissionName);

        if (hasPermission) {
            log.debug("RBAC ALLOW: user [{}] has permission [{}]",
                    principal.getUsername(), permissionName);
        } else {
            log.warn("RBAC DENY: user [{}] does NOT have permission [{}]",
                    principal.getUsername(), permissionName);
        }

        return hasPermission;
    }

    @Override
    public boolean hasPermission(Authentication authentication,
                                 Serializable targetId,
                                 String targetType,
                                 Object permission) {

        // Hiện tại chỉ kiểm tra permission-level, chưa kiểm tra resource-level ACL
        // Phần DataScope enforcement được thực hiện ở Service Layer
        return hasPermission(authentication, (Object) null, permission);
    }
}