package com.company.ems.backend.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer duration;
    private String reason;
    private String status;
    private String attachmentUrl;
    private Long approvedBy;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private LocalDateTime createdAt;

    // Multi-level approval progress
    private Integer currentApprovalLevel;
    private Integer maxApprovalLevel;
    private Boolean longLeaveHrRequired;

    // Ownership for cross-approval logic
    private Long requesterUserId;
}
