package com.company.ems.backend.rbac.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.employee.repository.EmployeeProfileRepository;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("dataScopeService")
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DataScopeServiceImpl implements DataScopeService {

    private final EmployeeProfileRepository profileRepository;

    @Override
    public boolean canAccessEmployee(Long targetEmployeeId) {
        CustomUserPrincipal principal = getCurrentPrincipal();
        if (principal == null) {
            log.warn("SCOPE_CHECK: no authenticated principal");
            return false;
        }

        if (principal.hasDataScope(DataScope.ALL)) {
            log.debug("SCOPE_ALLOW [ALL]: user=[{}] empId=[{}]",
                    principal.getUsername(), targetEmployeeId);
            return true;
        }

        if (principal.hasDataScope(DataScope.TEAM)) {
            boolean inTeam = isInManagerTeam(targetEmployeeId, principal);
            boolean isSelf  = isSelfEmployee(targetEmployeeId, principal);
            boolean allow   = inTeam || isSelf;
            if (!allow) {
                log.warn("SCOPE_DENY [TEAM]: manager=[{}] tried empId=[{}] (not in team)",
                        principal.getUsername(), targetEmployeeId);
            }
            return allow;
        }

        boolean isSelf = isSelfEmployee(targetEmployeeId, principal);
        if (!isSelf) {
            log.warn("SCOPE_DENY [SELF]: user=[{}] tried to access empId=[{}]",
                    principal.getUsername(), targetEmployeeId);
        }
        return isSelf;
    }

    @Override
    public boolean isInManagerTeam(Long targetEmployeeId) {
        CustomUserPrincipal principal = getCurrentPrincipal();
        if (principal == null) return false;
        return isInManagerTeam(targetEmployeeId, principal);
    }

    @Override
    public boolean isSelfEmployee(Long targetEmployeeId) {
        CustomUserPrincipal principal = getCurrentPrincipal();
        if (principal == null) return false;
        return isSelfEmployee(targetEmployeeId, principal);
    }

    private boolean isInManagerTeam(Long targetEmployeeId, CustomUserPrincipal principal) {
        return profileRepository.isEmployeeInManagerTeam(targetEmployeeId, principal.getUserId());
    }

    private boolean isSelfEmployee(Long targetEmployeeId, CustomUserPrincipal principal) {
        return profileRepository.findEmployeeIdByUserId(principal.getUserId())
                .map(empId -> empId.equals(targetEmployeeId))
                .orElse(false);
    }

    private CustomUserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof CustomUserPrincipal)) {
            return null;
        }
        return (CustomUserPrincipal) auth.getPrincipal();
    }
}