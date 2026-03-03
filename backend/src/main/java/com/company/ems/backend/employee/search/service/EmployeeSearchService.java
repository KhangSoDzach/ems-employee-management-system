package com.company.ems.backend.employee.search.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.search.dto.EmployeeListResponse;
import com.company.ems.backend.employee.search.dto.EmployeeSearchRequest;

public interface EmployeeSearchService {
    PageResponse<EmployeeListResponse> search(EmployeeSearchRequest request);
}