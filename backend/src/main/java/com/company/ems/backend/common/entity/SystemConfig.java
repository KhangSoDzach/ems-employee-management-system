package com.company.ems.backend.common.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Persistent key-value store for runtime system configuration.
 *
 * <p>
 * Used to override values that would otherwise come from
 * {@code application.yaml},
 * allowing admins to change settings (e.g. office GPS coordinates) without
 * restarting
 * the application.
 */
@Entity
@Table(name = "system_configs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique key identifying the configuration item (e.g. {@code OFFICE_LATITUDE}).
     */
    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    private String configKey;

    /** String-serialised value (numeric, boolean, or text). */
    @Column(name = "config_value", columnDefinition = "TEXT")
    private String configValue;

    /** Human-readable description of what this config controls. */
    @Column(name = "description", length = 500)
    private String description;

    /** Username or identifier of the last admin who changed this value. */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
