package com.company.ems.backend.employee.service;

import java.util.List;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.dto.EmployeeProfileProjection;
import com.company.ems.backend.employee.dto.EmployeeProfileResponse;
import com.company.ems.backend.employee.repository.EmployeeProfileRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeProfileServiceImpl implements EmployeeProfileService {

    private final EmployeeProfileRepository profileRepository;
    private final DataScopeService          dataScopeService;
    @Override
    public EmployeeProfileResponse getMyProfile() {
        Long userId = getCurrentPrincipal().getUserId();

        return profileRepository.findProfileByUserId(userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ nhân viên cho tài khoản hiện tại."));
    }
    @Override
    public EmployeeProfileResponse getProfileById(Long employeeId) {
        // Scope check lần 2 (defense in depth — lần 1 ở @PreAuthorize controller)
        if (!dataScopeService.canAccessEmployee(employeeId)) {
            throw new ForbiddenException();
        }

        return profileRepository.findProfileById(employeeId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));
    }

    @Override
    public PageResponse<EmployeeProfileResponse> listProfiles(
            int page, int size, String search, String status) {

        CustomUserPrincipal principal = getCurrentPrincipal();
        PageRequest pageable = PageRequest.of(page, size);
        Page<EmployeeProfileProjection> projectionPage;

        if (principal.hasDataScope(DataScope.ALL)) {
            projectionPage = profileRepository.findAllProfiles(search, status, pageable);

        } else if (principal.hasDataScope(DataScope.TEAM)) {
            // Manager: chỉ thấy team → dùng userId làm key tìm subordinates
            projectionPage = profileRepository.findTeamProfiles(principal.getUserId(), pageable);

        } else {
            // SELF: chỉ thấy chính mình
            return singleItemPage(getMyProfile());
        }

        List<EmployeeProfileResponse> content = projectionPage.getContent()
                .stream().map(this::toResponse).toList();

        return PageResponse.<EmployeeProfileResponse>builder()
                .content(content)
                .page(page).size(size)
                .totalElements(projectionPage.getTotalElements())
                .totalPages(projectionPage.getTotalPages())
                .first(projectionPage.isFirst())
                .last(projectionPage.isLast())
                .build();
    }

    private EmployeeProfileResponse toResponse(EmployeeProfileProjection p) {
        return EmployeeProfileResponse.builder()
                .id(p.getId())
                .employeeCode(p.getEmployeeCode())
                .fullName(p.getFirstName() + " " + p.getLastName())
                .email(p.getEmail())
                .phone(p.getPhone())
                .departmentName(p.getDepartmentName())
                .positionTitle(p.getPositionTitle())
                .hireDate(p.getHireDate())
                .status(p.getStatus() != null ? p.getStatus().toString() : null)
                .avatarUrl(p.getAvatarUrl())
                .workLocation(p.getWorkLocation())
                .build();
    }

    private CustomUserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (CustomUserPrincipal) auth.getPrincipal();
    }

    private PageResponse<EmployeeProfileResponse> singleItemPage(EmployeeProfileResponse item) {
        return PageResponse.<EmployeeProfileResponse>builder()
                .content(List.of(item))
                .page(0).size(1).totalElements(1L).totalPages(1)
                .first(true).last(true)
                .build();
    }
}