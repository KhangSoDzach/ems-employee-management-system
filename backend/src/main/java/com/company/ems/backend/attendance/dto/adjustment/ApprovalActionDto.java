package com.company.ems.backend.attendance.dto.adjustment;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for approval actions: approve, reject, or return-to-employee.
 *
 * <p>For {@code reject} and {@code returnToEmployee}, {@code reason} is mandatory
 * and validated at the service layer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalActionDto {

    /**
     * Comment or rejection/return reason.
     * Mandatory for reject and return-to-employee actions; optional for approve.
     */
    @Size(max = 2000, message = "Comment must not exceed 2000 characters")
    private String reason;
}
