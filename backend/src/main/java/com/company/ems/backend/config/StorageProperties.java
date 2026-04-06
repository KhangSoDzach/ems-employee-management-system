package com.company.ems.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * Binds {@code app.storage.*} properties from application.yaml.
 *
 * <pre>
 * app:
 *   storage:
 *     photo-dir:  ./uploads/attendance-photos
 *     base-url:   http://localhost:8080/uploads/attendance-photos
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "app.storage")
@Getter
@Setter
public class StorageProperties {

    /** Root directory for attendance photo files (server filesystem path). */
    private String photoDir = "./uploads/attendance-photos";

    /**
     * Public base URL from which the photos are served over HTTP.
     * Override in production via {@code APP_STORAGE_BASE_URL} env var.
     * Must NOT end with a trailing slash.
     */
    private String baseUrl = "http://localhost:8080/uploads/attendance-photos";
}
