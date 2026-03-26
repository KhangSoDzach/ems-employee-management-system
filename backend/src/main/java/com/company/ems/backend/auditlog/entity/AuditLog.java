package com.company.ems.backend.auditlog.entity;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.EventType;
import com.company.ems.backend.auditlog.enums.ResourceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Append-only Audit Log record.
 * Standardized for professional classification (Resource, EventType, Action).
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_resource", columnList = "resource"),
        @Index(name = "idx_audit_log_action", columnList = "action"),
        @Index(name = "idx_audit_log_category", columnList = "category"),
        @Index(name = "idx_audit_log_actor", columnList = "actor"),
        @Index(name = "idx_audit_log_created_at", columnList = "created_at")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Domain resource impacted (AUTH, EMPLOYEE, etc.) */
    @Enumerated(EnumType.STRING)
    @Column(name = "resource", nullable = false, length = 50, updatable = false)
    private ResourceType resource;

    /** High-level classification (AUTHENTICATION, AUTHORIZATION, etc.) */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50, updatable = false)
    private EventType eventType;

    /** Specific action performed. */
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50, updatable = false)
    private AuditAction action;

    /** Identity of the targeted resource (e.g. user_id string). */
    @Column(name = "target_id", length = 255, updatable = false)
    private String targetId;

    /** Human-readable identifier of the target (e.g. Full Name). */
    @Column(name = "identifier", length = 255, updatable = false)
    private String identifier;

    /** Identity of the actor (username). */
    @Column(name = "actor", nullable = false, length = 255, updatable = false)
    private String actor;

    @Column(name = "ip_address", length = 50, updatable = false)
    private String ipAddress;

    @Column(name = "client_type", length = 20, updatable = false)
    private String clientType;

    @Column(name = "old_value", columnDefinition = "TEXT", updatable = false)
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT", updatable = false)
    private String newValue;

    @Column(name = "user_agent", length = 1000, updatable = false)
    private String userAgent;

    @Column(name = "correlation_id", length = 100, updatable = false)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
