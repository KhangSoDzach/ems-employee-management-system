package com.company.ems.backend.common.service;

import org.springframework.stereotype.Service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.config.OfficeLocationProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Geolocation utility service.
 *
 * <p>Implements the <b>Haversine formula</b> to calculate the great-circle
 * distance between two WGS-84 coordinates on a spherical Earth.
 *
 * <p>IMPORTANT: distance validation is always performed server-side — the client
 * only sends raw (lat, lon) values; this service does the trustworthy computation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeolocationService {

    /** Mean Earth radius in metres (IUGG recommended value). */
    private static final double EARTH_RADIUS_METRES = 6_371_000.0;

    private final OfficeLocationProperties officeProps;

    /**
     * Calculates the Haversine distance (in metres) between two WGS-84 coordinates.
     *
     * @param lat1 latitude of point 1 (degrees)
     * @param lon1 longitude of point 1 (degrees)
     * @param lat2 latitude of point 2 (degrees)
     * @param lon2 longitude of point 2 (degrees)
     * @return distance in metres
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double phi1    = Math.toRadians(lat1);
        double phi2    = Math.toRadians(lat2);
        double deltaPhi    = Math.toRadians(lat2 - lat1);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double a = Math.sin(deltaPhi / 2)    * Math.sin(deltaPhi / 2)
                 + Math.cos(phi1) * Math.cos(phi2)
                 * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METRES * c;
    }

    /**
     * Validates that the given coordinates are within the configured office radius.
     *
     * @param latitude  user's current latitude
     * @param longitude user's current longitude
     * @throws BusinessException with error code {@code LOCATION_OUT_OF_RANGE} if too far
     */
    public void validateWithinOfficeRadius(double latitude, double longitude) {
        double distance = calculateDistance(
                latitude, longitude,
                officeProps.getLatitude(), officeProps.getLongitude()
        );

        log.debug("Geolocation check: user=({}, {}), office=({}, {}), distance={}m, allowed={}m",
                latitude, longitude,
                officeProps.getLatitude(), officeProps.getLongitude(),
                String.format("%.2f", distance), officeProps.getRadiusMeters());

        // Allow a small tolerance (in metres) to avoid false positives
        // from floating point/haversine boundary rounding.
        double epsilon = 0.1; // 0.1m tolerance (10 cm)
        if (distance - officeProps.getRadiusMeters() > epsilon) {
            throw new BusinessException(
                "LOCATION_OUT_OF_RANGE",
                String.format(
                    "Vị trí không hợp lệ. Bạn đang cách văn phòng %.1f mét (giới hạn cho phép: %.0f mét).",
                    distance, officeProps.getRadiusMeters()));
        }
    }

    /**
     * Checks whether coordinates are within the office radius.
     *
     * @return {@code true} if inside the allowed radius, {@code false} otherwise
     */
    public boolean isWithinOfficeRadius(double latitude, double longitude) {
        double distance = calculateDistance(
                latitude, longitude,
                officeProps.getLatitude(), officeProps.getLongitude()
        );
        return distance <= officeProps.getRadiusMeters();
    }

    /**
     * Returns the distance (in metres) from the given coordinates to the configured office.
     */
    public double distanceToOffice(double latitude, double longitude) {
        return calculateDistance(
                latitude, longitude,
                officeProps.getLatitude(), officeProps.getLongitude()
        );
    }
}
