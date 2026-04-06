package com.company.ems.backend.performance.review.entity;

import com.company.ems.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "one_on_one_meetings", indexes = {
        @Index(name = "idx_oom_manager",  columnList = "manager_id, is_deleted"),
        @Index(name = "idx_oom_employee", columnList = "employee_id, is_deleted")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OneOnOneMeeting extends BaseEntity {

    @Column(name = "manager_id", nullable = false)
    private Long managerId;

    @Column(name = "manager_name", length = 150)
    private String managerName;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_name", length = 150)
    private String employeeName;

    @Column(name = "meeting_date", nullable = false)
    private LocalDate meetingDate;

    @Column(length = 500)
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    @Column(name = "next_meeting_date")
    private LocalDate nextMeetingDate;
}