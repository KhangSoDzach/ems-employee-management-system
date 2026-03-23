package com.company.ems.backend.leave.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.company.ems.backend.leave.dto.LeaveApprovalHistoryResponse;
import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.dto.LeaveResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.entity.LeaveApprovalHistory;
import com.company.ems.backend.leave.entity.LeaveBalance;

@Mapper(componentModel = "spring")
public interface LeaveMapper {
    @Mapping(target = "employeeId",   source = "employee.id")
    @Mapping(target = "employeeName",
            expression = "java(leave.getEmployee() != null "
                    + "? leave.getEmployee().getFirstName() + \" \" + leave.getEmployee().getLastName() "
                    + ": null)")
    @Mapping(target = "leaveType",    expression = "java(leave.getLeaveType() != null ? leave.getLeaveType().name() : null)")
    @Mapping(target = "status",       expression = "java(leave.getStatus() != null ? leave.getStatus().name() : null)")
    @Mapping(target = "approvedBy",   source = "approvedBy.id")
    @Mapping(target = "approverName", expression = "java(leave.getApprovedBy() != null ? leave.getApprovedBy().getUsername() : null)")
    @Mapping(target = "duration",     source = "totalDays")
    LeaveResponse toResponse(Leave leave);
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "leaveType",  expression = "java(balance.getLeaveType() != null ? balance.getLeaveType().name() : null)")
    LeaveBalanceResponse toResponse(LeaveBalance balance);
    @Mapping(target = "action",       expression = "java(h.getAction() != null ? h.getAction().name() : null)")
    @Mapping(target = "statusBefore", expression = "java(h.getStatusBefore() != null ? h.getStatusBefore().name() : null)")
    @Mapping(target = "statusAfter",  expression = "java(h.getStatusAfter() != null ? h.getStatusAfter().name() : null)")
    LeaveApprovalHistoryResponse toHistoryResponse(LeaveApprovalHistory h);
}