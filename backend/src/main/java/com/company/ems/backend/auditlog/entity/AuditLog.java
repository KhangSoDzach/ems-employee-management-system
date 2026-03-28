package com.company.ems.backend.auditlog.entity;

import java.time.LocalDateTime;

import com.company.ems.backend.auditlog.enums.AuthActionType;

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
 * <p>
 * Design constraints (US-05 AC-05):
 * <ul>
 *   <li>No UPDATE path – entity has only getters (no setters outside of builder).</li>
 *   <li>No soft-delete fields – records are truly immutable once written.</li>
 *   <li>No @Version – optimistic locking not needed for append-only data.</li>
 * </ul>
 * SECURITY: passwords and raw tokens MUST NEVER be stored here.
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_entity_type", columnList = "entity_type"),
        @Index(name = "idx_audit_log_action_type", columnList = "action_type"),
        @Index(name = "idx_audit_log_actor",       columnList = "actor"),
        @Index(name = "idx_audit_log_identifier",  columnList = "identifier_attempted"),
        @Index(name = "idx_audit_log_created_at",  columnList = "created_at")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Domain category of the audited operation (e.g. AUTHENTICATION). */
    @Column(name = "entity_type", nullable = false, length = 100, updatable = false)
    private String entityType;

    /** Resolved user ID (UUID string) or SSO subject. Null when user is unknown. */
    @Column(name = "entity_id", length = 255, updatable = false)
    private String entityId;

    /** Specific action performed. */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50, updatable = false)
    private AuthActionType actionType;

    /** Resolved actor: user_id string or "ANONYMOUS". */
    @Column(name = "actor", length = 255, updatable = false)
    private String actor;

    /**
     * Credential identifier that was attempted (username / email).
     * Logged even on failure, but NEVER the password itself.
     */
    @Column(name = "identifier_attempted", length = 255, updatable = false)
    private String identifierAttempted;

    /** Previous state (null for most auth events). */
    @Column(name = "old_value", columnDefinition = "TEXT", updatable = false)
    private String oldValue;

    /**
     * JSON payload with contextual data, e.g.:
     * {"login_method":"JWT","result":"SUCCESS"}
     * NEVER include passwords or tokens.
     */
    @Column(name = "new_value", columnDefinition = "TEXT", updatable = false)
    private String newValue;

    /** Client IP address. */
    @Column(name = "ip_address", length = 50, updatable = false)
    private String ipAddress;

    /** HTTP User-Agent header value. */
    @Column(name = "user_agent", length = 1000, updatable = false)
    private String userAgent;

    /** Client type: WEB | MOBILE | API */
    @Column(name = "client_type", length = 20, updatable = false)
    private String clientType;

    /** Correlation / request ID for distributed tracing. */
    @Column(name = "correlation_id", length = 100, updatable = false)
    private String correlationId;

    /** Immutable creation timestamp – set automatically on persist. */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
