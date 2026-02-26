package com.company.ems.backend.employee.search.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.search.dto.EmployeeListResponse;
import com.company.ems.backend.employee.search.dto.EmployeeSearchRequest;
import com.company.ems.backend.employee.search.repository.EmployeeSearchRepository;
import com.company.ems.backend.employee.search.repository.EmployeeSpecification;
import com.company.ems.backend.rbac.service.DataScopeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EmployeeSearchServiceImpl implements EmployeeSearchService {

    private final EmployeeSearchRepository searchRepository;
    private final DataScopeService         dataScopeService;

    @Override
    public PageResponse<EmployeeListResponse> search(EmployeeSearchRequest request) {
        CustomUserPrincipal principal = getCurrentPrincipal();
        String username = principal != null ? principal.getUsername() : "anonymous";
        String roles    = principal != null ? principal.getRoleNames().toString() : "N/A";

        Specification<Employee> scopeSpec = dataScopeService.buildScopeSpec();
        Specification<Employee> searchCriteria = EmployeeSpecification.searchCriteria(
                request.getKeyword(),
                request.getDepartment(),
                request.getStatus()
        );
        Specification<Employee> finalSpec = Specification
                .where(scopeSpec)
                .and(searchCriteria);
        String sortField = AllowedSortFields.validateSortField(request.getSortBy());
        Sort.Direction dir = "desc".equalsIgnoreCase(request.getSortDir())
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageable = PageRequest.of(request.getPage(), request.getSize(),
                Sort.by(dir, sortField));

        Page<Employee> page = searchRepository.findAll(finalSpec, pageable);
        List<EmployeeListResponse> content = page.getContent()
                .stream().map(this::toResponse).toList();

        log.info("SEARCH_AUDIT | user=[{}] | roles=[{}] | keyword=[{}] | dept=[{}] | " +
                        "status=[{}] | page=[{}] | size=[{}] | resultCount=[{}] | total=[{}]",
                username, roles,
                sanitizeForLog(request.getKeyword()),
                sanitizeForLog(request.getDepartment()),
                request.getStatus(),
                request.getPage(), request.getSize(),
                content.size(), page.getTotalElements());

        return PageResponse.<EmployeeListResponse>builder()
                .content(content)
                .page(request.getPage())
                .size(request.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private EmployeeListResponse toResponse(Employee e) {
        return EmployeeListResponse.builder()
                .id(e.getId())
                .employeeCode(e.getEmployeeCode())
                .fullName(e.getFirstName() + " " + e.getLastName())
                .email(e.getEmail())
                .phone(e.getPhone())
                .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                .positionTitle(e.getPosition() != null ? e.getPosition().getTitle() : null)
                .workLocation(e.getWorkLocation())
                .hireDate(e.getHireDate())
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .avatarUrl(e.getAvatarUrl())
                .build();
    }

    private CustomUserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserPrincipal p) return p;
        return null;
    }

    private String sanitizeForLog(String value) {
        if (value == null) return null;
        return value.replaceAll("[\r\n\t]", "_");
    }
}