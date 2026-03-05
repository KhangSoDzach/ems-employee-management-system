package com.company.ems.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * Binds {@code app.office.*} properties from application.yaml.
 *
 * <pre>
 * app:
 *   office:
 *     latitude: 10.762622
 *     longitude: 106.660172
 *     radius-meters: 30
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "app.office")
@Getter
@Setter
public class OfficeLocationProperties {

    /** Office latitude (WGS-84). */
    private double latitude = 10.762622;

    /** Office longitude (WGS-84). */
    private double longitude = 106.660172;

    /** Maximum allowed distance from office in metres (default 30 m). */
    private double radiusMeters = 30.0;
}
