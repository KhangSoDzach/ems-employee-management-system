package com.company.ems.backend.audit.entity;

import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "audit_logs",
        indexes = {
                @Index(name = "idx_audit_created_at",     columnList = "created_at"),
                @Index(name = "idx_audit_user_id",         columnList = "user_id"),
                @Index(name = "idx_audit_action_type",     columnList = "action_type"),
                @Index(name = "idx_audit_result",          columnList = "result"),
                @Index(name = "idx_audit_user_created",    columnList = "user_id, created_at"),
                @Index(name = "idx_audit_action_created",  columnList = "action_type, created_at")
        }
)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(updatable = false)
    private Long id;

    @Column(name = "user_id", updatable = false)
    private Long userId;

    @Column(name = "identifier_attempted", length = 255, updatable = false)
    private String identifierAttempted;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50, updatable = false)
    private AuditActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20, updatable = false)
    private AuditResult result;

    @Enumerated(EnumType.STRING)
    @Column(name = "login_method", length = 20, updatable = false)
    private LoginMethod loginMethod;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    @Column(name = "user_agent", length = 500, updatable = false)
    private String userAgent;

    @Column(name = "client_type", length = 50, updatable = false)
    private String clientType;

    @Column(name = "correlation_id", length = 100, updatable = false)
    private String correlationId;

    @Column(name = "message", length = 500, updatable = false)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}