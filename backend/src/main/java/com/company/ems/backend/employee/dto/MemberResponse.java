package com.company.ems.backend.employee.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * Slim projection of an Employee intended for the Manager's "My Team" view.
 * Intentionally omits sensitive fields (salary, bank account, national ID, etc.)
 * so that Managers only see the data they need.
 */
@Data
@Builder
@Schema(description = "Slim employee projection for the Manager team-member list")
public class MemberResponse {

    @Schema(description = "Employee primary key")
    private Long id;

    @Schema(description = "User account ID")
    private Long userId;

    @Schema(description = "Auto-generated employee code, e.g. IT202600001")
    private String employeeCode;

    @Schema(description = "Full display name (firstName + lastName)")
    private String fullName;

    @Schema(description = "Work email address")
    private String email;

    @Schema(description = "URL of the avatar / profile photo")
    private String avatarUrl;

    @Schema(description = "Position title, e.g. 'Frontend Developer'")
    private String positionTitle;

    @Schema(description = "Department name, e.g. 'IT'")
    private String departmentName;

    @Schema(description = "Current employment status")
    private String status;
}