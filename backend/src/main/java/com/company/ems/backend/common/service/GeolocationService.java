package com.company.ems.backend.common.service;

import org.springframework.stereotype.Service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.position.entity.Position;

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
        private static final double LOCATION_EPSILON_METRES = 0.1;
        private static final String ERROR_POSITION_LOCATION_NOT_CONFIGURED = "POSITION_LOCATION_NOT_CONFIGURED";
        private static final String ERROR_LOCATION_OUT_OF_RANGE = "LOCATION_OUT_OF_RANGE";
        private static final String MESSAGE_POSITION_LOCATION_NOT_CONFIGURED =
            "Vị trí công việc chưa được gán khu vực check-in. Vui lòng liên hệ admin cấu hình.";

    private final com.company.ems.backend.attendance.repository.OfficeLocationRepository officeLocationRepository;

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
     * Validates that the given coordinates are within the radius of any active office.
     *
     * @param latitude  user's current latitude
     * @param longitude user's current longitude
     * @throws BusinessException with error code {@code LOCATION_OUT_OF_RANGE} if too far from all offices
     */
    public void validateWithinOfficeRadius(double latitude, double longitude) {
        var activeLocations = officeLocationRepository.findByIsActiveTrue();
        
        if (activeLocations.isEmpty()) {
            log.warn("No active office locations configured. Geolocation validation skipped.");
            return;
        }

        double minDistance = Double.MAX_VALUE;
        com.company.ems.backend.attendance.entity.OfficeLocation closestOffice = activeLocations.get(0);

        for (var location : activeLocations) {
            double distance = calculateDistance(latitude, longitude, location.getLatitude(), location.getLongitude());
            
            // Allow a small tolerance (in metres) to avoid false positives
            double epsilon = 0.1; 
            if (distance - location.getRadiusMeters() <= epsilon) {
                log.debug("Geolocation check PASSED: user=({}, {}), office='{}'=({}, {}), distance={}m, allowed={}m",
                        latitude, longitude, location.getName(), location.getLatitude(), location.getLongitude(),
                        String.format("%.2f", distance), location.getRadiusMeters());
                return; // User is within range of at least one office
            }

            if (distance < minDistance) {
                minDistance = distance;
                closestOffice = location;
            }
        }

        log.debug("Geolocation check FAILED: user=({}, {}), closest office='{}'=({}, {}), distance={}m",
                latitude, longitude, closestOffice.getName(), closestOffice.getLatitude(), closestOffice.getLongitude(),
                String.format("%.2f", minDistance));

        throw new BusinessException(
            ERROR_LOCATION_OUT_OF_RANGE,
            String.format(
                "Vị trí không hợp lệ. Bạn đang cách văn phòng gần nhất (%s) %.1f mét.",
                closestOffice.getName(), minDistance));
    }

    public void validateWithinOfficeRadiusForEmployee(Employee employee, double latitude, double longitude) {
        Position position = employee.getPosition();
        if (position == null || position.getOfficeLocation() == null) {
            throw new BusinessException(ERROR_POSITION_LOCATION_NOT_CONFIGURED, MESSAGE_POSITION_LOCATION_NOT_CONFIGURED);
        }

        var location = position.getOfficeLocation();
        if (!Boolean.TRUE.equals(location.getIsActive())) {
            throw new BusinessException(ERROR_POSITION_LOCATION_NOT_CONFIGURED, MESSAGE_POSITION_LOCATION_NOT_CONFIGURED);
        }

        double distance = calculateDistance(latitude, longitude, location.getLatitude(), location.getLongitude());
        if (distance - location.getRadiusMeters() > LOCATION_EPSILON_METRES) {
            throw new BusinessException(
                    ERROR_LOCATION_OUT_OF_RANGE,
                    String.format(
                            "Vị trí không hợp lệ cho chức danh %s. Bạn đang cách khu vực cho phép (%s) %.1f mét.",
                            position.getTitle(),
                            location.getName(),
                            distance));
        }
    }

    /**
     * Checks whether coordinates are within any office radius.
     *
     * @return {@code true} if inside any allowed radius, {@code false} otherwise
     */
    public boolean isWithinOfficeRadius(double latitude, double longitude) {
        var activeLocations = officeLocationRepository.findByIsActiveTrue();
        for (var location : activeLocations) {
            double distance = calculateDistance(latitude, longitude, location.getLatitude(), location.getLongitude());
            if (distance <= location.getRadiusMeters()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the distance (in metres) from the given coordinates to the closest active office.
     */
    public double distanceToClosestOffice(double latitude, double longitude) {
        var activeLocations = officeLocationRepository.findByIsActiveTrue();
        return activeLocations.stream()
                .mapToDouble(loc -> calculateDistance(latitude, longitude, loc.getLatitude(), loc.getLongitude()))
                .min()
                .orElse(Double.MAX_VALUE);
    }
}
