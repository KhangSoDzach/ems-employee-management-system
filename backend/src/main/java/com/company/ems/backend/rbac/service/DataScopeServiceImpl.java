package com.company.ems.backend.rbac.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.repository.LeaveRepository;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataScopeServiceImpl implements DataScopeService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRepository leaveRepository;

    /**
     * AC-06: Người dùng có DataScope=SELF không được xem dữ liệu của người khác.
     */
    @Override
    @Transactional(readOnly = true)
    public void assertCanAccessEmployee(CustomUserPrincipal principal, Long targetEmpId) {
        // DataScope.ALL → cho phép truy cập tất cả
        if (principal.hasDataScope(DataScope.ALL)) {
            log.debug("DataScope ALL: user [{}] granted access to employee [{}]",
                    principal.getUsername(), targetEmpId);
            return;
        }

        // Load target employee
        Employee targetEmployee = employeeRepository.findById(targetEmpId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", targetEmpId));

        // DataScope.DEPARTMENT → kiểm tra cùng phòng ban
        if (principal.hasDataScope(DataScope.DEPARTMENT)) {
            Employee currentEmployee = getEmployeeByUserId(principal.getUserId());
            if (currentEmployee.getDepartment() != null
                    && targetEmployee.getDepartment() != null
                    && currentEmployee.getDepartment().getId()
                    .equals(targetEmployee.getDepartment().getId())) {
                log.debug("DataScope DEPARTMENT: user [{}] granted access to employee [{}]",
                        principal.getUsername(), targetEmpId);
                return;
            }
        }

        // DataScope.TEAM → kiểm tra target employee có báo cáo cho user hiện tại không
        if (principal.hasDataScope(DataScope.TEAM)) {
            if (targetEmployee.getReportingManager() != null
                    && targetEmployee.getReportingManager().getUser() != null
                    && targetEmployee.getReportingManager().getUser().getId()
                    .equals(principal.getUserId())) {
                log.debug("DataScope TEAM: user [{}] granted access to subordinate employee [{}]",
                        principal.getUsername(), targetEmpId);
                return;
            }
            // Manager cũng được xem thông tin của chính mình
            Employee currentEmployee = getEmployeeByUserId(principal.getUserId());
            if (currentEmployee.getId().equals(targetEmpId)) {
                return;
            }
        }

        // DataScope.SELF → chỉ xem dữ liệu của chính mình
        if (principal.hasDataScope(DataScope.SELF)) {
            if (targetEmployee.getUser() != null
                    && targetEmployee.getUser().getId().equals(principal.getUserId())) {
                log.debug("DataScope SELF: user [{}] granted access to own employee record [{}]",
                        principal.getUsername(), targetEmpId);
                return;
            }
        }

        // Không thỏa mãn bất kỳ scope nào → từ chối
        log.warn("DataScope DENY: user [{}] (userId={}) attempted to access employee [{}] without sufficient scope. User scopes: {}",
                principal.getUsername(), principal.getUserId(), targetEmpId, principal.getDataScopes());
        throw new ForbiddenException();
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanAccessLeave(CustomUserPrincipal principal, Long leaveId) {
        // ALL scope → cho phép
        if (principal.hasDataScope(DataScope.ALL)) {
            return;
        }

        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave", "id", leaveId));

        Long leaveEmployeeId = leave.getEmployee().getId();

        // Delegate về assertCanAccessEmployee
        assertCanAccessEmployee(principal, leaveEmployeeId);
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanApproveLeave(CustomUserPrincipal principal, Long leaveId) {
        // SELF scope → không bao giờ được approve (chỉ xem của mình)
        if (!principal.hasDataScope(DataScope.TEAM) && !principal.hasDataScope(DataScope.ALL)) {
            log.warn("DataScope DENY APPROVE: user [{}] with scopes {} attempted to approve leave [{}]",
                    principal.getUsername(), principal.getDataScopes(), leaveId);
            throw new ForbiddenException();
        }

        // Kiểm tra thêm TEAM scope - chỉ approve leave của team mình
        if (!principal.hasDataScope(DataScope.ALL)) {
            assertCanAccessLeave(principal, leaveId);
        }
    }

    @Override
    public CustomUserPrincipal getCurrentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserPrincipal)) {
            throw new ForbiddenException();
        }
        return (CustomUserPrincipal) authentication.getPrincipal();
    }

    private Employee getEmployeeByUserId(Long userId) {
        return employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employee record not found for userId: " + userId));
    }
}