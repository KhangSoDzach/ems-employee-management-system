package com.company.ems.backend.employee.service;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeProfileResponse;

public interface EmployeeProfileService {

    EmployeeProfileResponse getMyProfile();
    EmployeeProfileResponse getProfileById(Long employeeId);
    PageResponse<EmployeeProfileResponse> listProfiles(
            int page, int size, String search, String status);
}