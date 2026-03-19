package com.company.ems.backend.asset.security;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.repository.AssetRepository;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AssetDataScopeService {

    private final AssetRepository     assetRepository;
    private final EmployeeRepository  employeeRepository;

    public CustomUserPrincipal requireCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof CustomUserPrincipal p)) {
            throw new ForbiddenException();
        }
        return p;
    }

    public Page<Asset> listAssets(AssetStatus status, String type,
                                  String keyword, Pageable pageable) {
        CustomUserPrincipal principal = requireCurrentPrincipal();
        if (principal.hasDataScope(DataScope.ALL)) {
            return assetRepository.searchAll(status, type, keyword, pageable);
        }

        if (principal.hasDataScope(DataScope.TEAM)) {
            Long deptId = resolveManagerDepartmentId(principal);
            return assetRepository.searchByDepartment(deptId, status, type, keyword, pageable);
        }

        Long empId = resolveEmployeeId(principal);
        return assetRepository.searchByEmployee(empId, status, type, keyword, pageable);
    }

    public Asset requireAccessibleAsset(Long assetId) {
        Asset asset = assetRepository.findActiveById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));

        CustomUserPrincipal principal = requireCurrentPrincipal();

        if (principal.hasDataScope(DataScope.ALL)) {
            return asset;
        }

        if (principal.hasDataScope(DataScope.TEAM)) {
            assertAssetInManagerDepartment(asset, principal);
            return asset;
        }

        assertAssetBelongsToEmployee(asset, principal);
        return asset;
    }

    private Long resolveEmployeeId(CustomUserPrincipal principal) {
        return employeeRepository.findEmployeeIdByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(principal.getUsername()));
    }

    private Long resolveManagerDepartmentId(CustomUserPrincipal principal) {
        return employeeRepository.findDepartmentIdByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(principal.getUsername()));
    }

    private void assertAssetInManagerDepartment(Asset asset, CustomUserPrincipal principal) {
        if (asset.getAssignedTo() == null) {
            return;
        }

        if (asset.getAssignedTo().getDepartment() == null) {
            return;
        }

        Long managerDeptId = employeeRepository.findDepartmentIdByUserId(principal.getUserId())
                .orElse(null);
        Long assetDeptId = asset.getAssignedTo().getDepartment().getId();

        if (managerDeptId == null || !assetDeptId.equals(managerDeptId)) {
            log.warn("SCOPE_DENY [TEAM]: manager=[{}] tried asset=[{}] in dept=[{}], own dept=[{}]",
                    principal.getUsername(), asset.getId(), assetDeptId, managerDeptId);
            throw new ForbiddenException();
        }
    }

    private void assertAssetBelongsToEmployee(Asset asset, CustomUserPrincipal principal) {
        if (asset.getAssignedTo() == null) {
            log.warn("SCOPE_DENY [SELF]: user=[{}] tried asset=[{}] (not assigned to them)",
                    principal.getUsername(), asset.getId());
            throw new ForbiddenException();
        }

        Long empId = employeeRepository.findEmployeeIdByUserId(principal.getUserId())
                .orElse(null);

        if (empId == null || !empId.equals(asset.getAssignedTo().getId())) {
            log.warn("SCOPE_DENY [SELF]: user=[{}] tried asset=[{}] assigned to empId=[{}]",
                    principal.getUsername(), asset.getId(),
                    asset.getAssignedTo().getId());
            throw new ForbiddenException();
        }
    }
}