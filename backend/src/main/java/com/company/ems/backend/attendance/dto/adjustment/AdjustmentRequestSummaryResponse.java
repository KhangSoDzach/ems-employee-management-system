package com.company.ems.backend.attendance.dto.adjustment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lightweight summary row used in paginated list views (employee and manager inboxes).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustmentRequestSummaryResponse {

    private Long          id;
    private String        employeeName;
    private String        employeeCode;
    private LocalDate     requestDate;
    private String        reasonType;  // enum name
    private String        status;      // enum name — for coloured badge in UI
    private int           currentApprovalLevel;
    private int           maxApprovalLevel;
    /** Flags requests that need extra manual scrutiny. */
    private boolean       requiresManualReview;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
