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
 *     photo-dir: ./uploads/attendance-photos
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "app.storage")
@Getter
@Setter
public class StorageProperties {

    /** Root directory for attendance photo files. */
    private String photoDir = "./uploads/attendance-photos";
}
