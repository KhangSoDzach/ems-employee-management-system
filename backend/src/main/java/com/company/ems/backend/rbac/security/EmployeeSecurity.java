package com.company.ems.backend.rbac.security;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("empSec")
@RequiredArgsConstructor
@Slf4j
public class EmployeeSecurity {

    private final EmployeeRepository employeeRepository;
    private final LeaveRepository    leaveRepository;

    public boolean canAccessEmployee(Authentication auth, Long employeeId) {
        CustomUserPrincipal p = (CustomUserPrincipal) auth.getPrincipal();

        if (p.hasDataScope(DataScope.ALL)) return true;

        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        if (employee == null) return false;

        if (p.hasDataScope(DataScope.TEAM)) {
            boolean inTeam = employee.getReportingManager() != null
                    && employee.getReportingManager().getUser() != null
                    && employee.getReportingManager().getUser().getId().equals(p.getUserId());

            boolean isSelf = employee.getUser() != null
                    && employee.getUser().getId().equals(p.getUserId());

            if (!inTeam && !isSelf) {
                log.warn("SCOPE_DENY [TEAM]: manager=[{}] tried empId=[{}]",
                        p.getUsername(), employeeId);
            }
            return inTeam || isSelf;
        }

        boolean isSelf = employee.getUser() != null
                && employee.getUser().getId().equals(p.getUserId());
        if (!isSelf) {
            log.warn("SCOPE_DENY [SELF]: user=[{}] tried empId=[{}]", p.getUsername(), employeeId);
        }
        return isSelf;
    }

    public boolean canAccessLeave(Authentication auth, Long leaveId) {
        CustomUserPrincipal p = (CustomUserPrincipal) auth.getPrincipal();
        if (p.hasDataScope(DataScope.ALL)) return true;

        Leave leave = leaveRepository.findById(leaveId).orElse(null);
        if (leave == null) return false;

        Employee employee = leave.getEmployee();

        if (p.hasDataScope(DataScope.TEAM)) {
            return employee.getReportingManager() != null
                    && employee.getReportingManager().getUser() != null
                    && employee.getReportingManager().getUser().getId().equals(p.getUserId());
        }
        return employee.getUser() != null
                && employee.getUser().getId().equals(p.getUserId());
    }

    public boolean canApproveLeave(Authentication auth, Long leaveId) {
        CustomUserPrincipal p = (CustomUserPrincipal) auth.getPrincipal();
        if (p.hasDataScope(DataScope.ALL)) return true;
        if (!p.hasDataScope(DataScope.TEAM)) return false;

        Leave leave = leaveRepository.findById(leaveId).orElse(null);
        if (leave == null) return false;

        Employee e = leave.getEmployee();
        return e.getReportingManager() != null
                && e.getReportingManager().getUser() != null
                && e.getReportingManager().getUser().getId().equals(p.getUserId());
    }

    public boolean isOwnLeave(Authentication auth, Long leaveId) {
        CustomUserPrincipal p = (CustomUserPrincipal) auth.getPrincipal();
        return leaveRepository.findById(leaveId)
                .map(l -> l.getEmployee().getUser() != null
                        && l.getEmployee().getUser().getId().equals(p.getUserId()))
                .orElse(false);
    }
}