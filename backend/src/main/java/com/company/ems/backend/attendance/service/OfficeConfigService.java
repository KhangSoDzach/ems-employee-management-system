package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.OfficeConfigRequest;
import com.company.ems.backend.attendance.dto.OfficeConfigResponse;

/**
 * Application service for managing office GPS location configuration at
 * runtime.
 *
 * <p>
 * Provides two update strategies:
 * <ul>
 * <li><em>Manual</em> — admin types in specific coordinates and radius.</li>
 * <li><em>Auto</em> — admin's browser sends its current geolocation; the server
 * treats those coordinates as the new office location.</li>
 * </ul>
 *
 * <p>
 * Values are persisted to {@code system_configs} and take effect immediately
 * without an application restart.
 */
public interface OfficeConfigService {

    /**
     * Returns the currently active office location configuration.
     *
     * @return config sourced from DB (if set) or YAML defaults
     */
    OfficeConfigResponse getOfficeConfig();

    /**
     * Manually sets the office location to the provided latitude, longitude, and
     * radius.
     *
     * @param request   validated coordinates + radius
     * @param updatedBy username of the acting admin
     * @return the saved configuration
     */
    OfficeConfigResponse updateManual(OfficeConfigRequest request, String updatedBy);

    /**
     * Sets the office location to the coordinates sent in the request body
     * (the admin's browser current position). Radius is optional; the existing
     * configured value is kept if not supplied.
     *
     * @param request   validated coordinates (radiusMeters optional)
     * @param updatedBy username of the acting admin
     * @return the saved configuration
     */
    OfficeConfigResponse updateAuto(OfficeConfigRequest request, String updatedBy);
}
