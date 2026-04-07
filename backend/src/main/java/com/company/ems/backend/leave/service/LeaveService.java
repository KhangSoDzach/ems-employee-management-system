package com.company.ems.backend.leave.service;

import java.time.LocalDate;

import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.leave.dto.ApproveLeaveRequest;
import com.company.ems.backend.leave.dto.LeaveRequest;
import com.company.ems.backend.leave.dto.LeaveResponse;

public interface LeaveService {
    LeaveResponse createLeaveRequest(LeaveRequest request);
    PageResponse<LeaveResponse> getMyLeaves(int page, int size);
    PageResponse<LeaveResponse> getAllLeaves(
            int page,
            int size,
            Long employeeId,
            String status,
            String leaveType,
            LocalDate startDate,
            LocalDate endDate
    );
    LeaveResponse getLeaveById(Long id);
    PageResponse<LeaveResponse> getPendingForApprover(int page, int size);
    LeaveResponse approveLeave(Long id, ApproveLeaveRequest request);
    void cancelLeave(Long id);
}
