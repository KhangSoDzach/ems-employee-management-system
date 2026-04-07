package com.company.ems.backend.attendance.dto.adjustment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A single entry in the approval audit timeline shown on the detail / modal page.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAdjustmentHistoryResponse {

    private Long          id;

    /** Display name of the user who performed this action. */
    private String        actionByName;
    private Long          actionByUserId;

    /**
     * Action type (e.g. SUBMITTED, APPROVED, REJECTED, RETURNED_TO_EMPLOYEE, RESUBMITTED).
     * Used by the frontend to pick an icon / colour for each timeline entry.
     */
    private String action;

    /** Approval level at which this action was performed (null for SUBMITTED). */
    private Integer levelActedOn;

    /** Comment or reason provided by the actor. */
    private String comment;

    private LocalDateTime actionAt;

    private String statusBefore;
    private String statusAfter;
}
