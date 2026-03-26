package com.company.ems.backend.employee.service;

import java.util.List;
import java.util.Map;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeAttachmentResponse;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.dto.OfficialContractRequest;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeRequest request);

    /** Trả hồ sơ (read-only, public fields) của chính user đang đăng nhập */
    PublicEmployeeResponse getMyProfile();

    PageResponse<EmployeeResponse> getAllEmployees(
            int page,
            int size,
            String department,
            String position,
            String status,
            String search);

    EmployeeResponse getEmployeeById(Long id);

    EmployeeResponse updateEmployee(Long id, EmployeeRequest request);

    EmployeeResponse convertToOfficial(Long id, OfficialContractRequest request);

    String uploadEmployeeFile(Long id, MultipartFile file, String fileType);

    List<EmployeeAttachmentResponse> getEmployeeAttachments(Long id);

    List<EmployeeAttachmentResponse> getMyEmployeeAttachments();

    void deleteEmployeeAttachment(Long id, Long attachmentId);

    void deleteEmployee(Long id);

    /**
     * Trả danh sách nhân viên giữ vị trí manager (level >= 3) để chọn Người quản lý
     */
    List<Map<String, Object>> getManagers();

    /**
     * Trả danh sách thành viên trong team của manager đang đăng nhập.
     * Dùng DataScope TEAM: chỉ trả nhân viên có reportingManager = manager đó.
     * Dành cho trang /members của role MANAGER.
     *
     * @param page   0-based page number
     * @param size   page size
     * @param search optional keyword filter on name/email
     */
    PageResponse<MemberResponse> getTeamMembers(int page, int size, String search);
}
