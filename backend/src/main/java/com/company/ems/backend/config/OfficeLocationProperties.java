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
    private double latitude = 10.80374375;

    /** Office longitude (WGS-84). */
    private double longitude = 106.6896745;

    /** Maximum allowed distance from office in metres (default 30 m). */
    private double radiusMeters = 30.0;

    /** Shift 1 check-in time (HH:mm) */
    private String shift1CheckIn = "08:00";

    /** Shift 1 check-out time (HH:mm) */
    private String shift1CheckOut = "12:00";

    /** Shift 2 check-in time (HH:mm) */
    private String shift2CheckIn = "13:30";

    /** Shift 2 check-out time (HH:mm) */
    private String shift2CheckOut = "17:30";

    /** Grace period in minutes */
    private int gracePeriod = 15;

    /** Early leave threshold in minutes */
    private int earlyLeaveThreshold = 15;
}
