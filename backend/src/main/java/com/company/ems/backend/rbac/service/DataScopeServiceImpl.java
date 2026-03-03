package com.company.ems.backend.rbac.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeProfileRepository;
import com.company.ems.backend.employee.search.repository.EmployeeSpecification;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.jpa.domain.Specification;
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
        if (principal == null) return false;

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
            log.warn("SCOPE_DENY [SELF]: user=[{}] tried empId=[{}]",
                    principal.getUsername(), targetEmployeeId);
        }
        return isSelf;
    }

    @Override
    public boolean isInManagerTeam(Long targetEmployeeId) {
        CustomUserPrincipal p = getCurrentPrincipal();
        return p != null && isInManagerTeam(targetEmployeeId, p);
    }

    @Override
    public boolean isSelfEmployee(Long targetEmployeeId) {
        CustomUserPrincipal p = getCurrentPrincipal();
        return p != null && isSelfEmployee(targetEmployeeId, p);
    }

    @Override
    public Specification<Employee> buildScopeSpec() {
        CustomUserPrincipal principal = getCurrentPrincipal();
        if (principal == null) {
            return (root, query, cb) -> cb.disjunction();
        }

        if (principal.hasDataScope(DataScope.ALL)) {
            log.debug("SCOPE_SPEC [ALL]: user=[{}]", principal.getUsername());
            return Specification.where(null); // No additional constraint
        }

        if (principal.hasDataScope(DataScope.TEAM)) {
            log.debug("SCOPE_SPEC [TEAM]: manager=[{}] userId=[{}]",
                    principal.getUsername(), principal.getUserId());
            return EmployeeSpecification.inManagerTeam(principal.getUserId());
        }

        log.warn("SCOPE_SPEC [SELF]: user=[{}] không được list search", principal.getUsername());
        return (root, query, cb) -> cb.disjunction();
    }

    private boolean isInManagerTeam(Long empId, CustomUserPrincipal p) {
        return profileRepository.isEmployeeInManagerTeam(empId, p.getUserId());
    }

    private boolean isSelfEmployee(Long empId, CustomUserPrincipal p) {
        return profileRepository.findEmployeeIdByUserId(p.getUserId())
                .map(id -> id.equals(empId))
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