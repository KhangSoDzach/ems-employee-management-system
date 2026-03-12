package com.company.ems.backend.common.service;

import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.config.OfficeLocationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link GeolocationService}.
 *
 * <p>Test coordinates are chosen so that the expected distances can be verified
 * independently using publicly available Haversine calculators.
 */
@DisplayName("GeolocationService – Haversine formula & radius validation")
@org.junit.jupiter.api.extension.ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class GeolocationServiceTest {

    /** Office anchor: Ho Chi Minh City – District 1 (default config). */
    private static final double OFFICE_LAT = 10.762622;
    private static final double OFFICE_LON = 106.660172;
    private static final double RADIUS_M   = 30.0;

    /** Branch anchor: Hanoi (for multi-office test). */
    private static final double BRANCH_LAT = 21.028511;
    private static final double BRANCH_LON = 105.804817;
    private static final double BRANCH_RADIUS = 50.0;

    @org.mockito.Mock
    private com.company.ems.backend.attendance.repository.OfficeLocationRepository officeLocationRepository;

    private GeolocationService service;

    @BeforeEach
    void setUp() {
        service = new GeolocationService(officeLocationRepository);
    }

    private com.company.ems.backend.attendance.entity.OfficeLocation createOffice(String name, double lat, double lon, double radius) {
        return com.company.ems.backend.attendance.entity.OfficeLocation.builder()
                .name(name)
                .latitude(lat)
                .longitude(lon)
                .radiusMeters(radius)
                .isActive(true)
                .build();
    }

    // ─── Haversine distance ───────────────────────────────────────────────────

    @Nested
    @DisplayName("calculateDistance()")
    class CalculateDistance {

        @Test
        @DisplayName("Same point → distance 0")
        void samePoint_returnsZero() {
            double d = service.calculateDistance(OFFICE_LAT, OFFICE_LON, OFFICE_LAT, OFFICE_LON);
            assertThat(d).isEqualTo(0.0);
        }

        @Test
        @DisplayName("Antipodal points → roughly π × R ≈ 20 015 km")
        void antipodalPoints() {
            double d = service.calculateDistance(0, 0, 0, 180);
            // half circumference ≈ 20_015_087 m (allow 1 km tolerance)
            assertThat(d).isBetween(20_000_000.0, 20_030_000.0);
        }

        @Test
        @DisplayName("~1 degree latitude apart → roughly 111 km")
        void oneDegreeLat() {
            double d = service.calculateDistance(0.0, 0.0, 1.0, 0.0);
            // 1° of latitude ≈ 111 194 m
            assertThat(d).isBetween(111_000.0, 111_400.0);
        }

        @ParameterizedTest(name = "distance({0},{1} → {2},{3}) ≈ {4}m ± {5}m")
        @CsvSource({
            // lat1, lon1, lat2, lon2, expectedMeters, toleranceMeters
            "10.762622, 106.660172, 10.762622, 106.660172,    0, 0.1",   // same point
            "10.762622, 106.660172, 10.762852, 106.660172,   25, 5",     // ~25 m north
            "10.762622, 106.660172, 10.763522, 106.660172,  100, 5",     // ~100 m north
            "10.762622, 106.660172, 10.760000, 106.660172,  292, 10",    // ~292 m south
        })
        @DisplayName("Parameterised coordinate pairs")
        void parameterisedDistances(double lat1, double lon1, double lat2, double lon2,
                                    double expectedM, double toleranceM) {
            double d = service.calculateDistance(lat1, lon1, lat2, lon2);
            assertThat(d).isCloseTo(expectedM, within(toleranceM));
        }
    }

    // ─── Radius validation ────────────────────────────────────────────────────

    @Nested
    @DisplayName("validateWithinOfficeRadius()")
    class RadiusValidation {

        @Test
        @DisplayName("Exact office location → no exception")
        void exactOfficeLocation_noThrow() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));
            
            assertThatNoException().isThrownBy(
                    () -> service.validateWithinOfficeRadius(OFFICE_LAT, OFFICE_LON));
        }

        @Test
        @DisplayName("Within 30 m → no exception")
        void within30m_noThrow() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));

            // Move ~20 m north (≈ 0.000180°)
            assertThatNoException().isThrownBy(
                    () -> service.validateWithinOfficeRadius(OFFICE_LAT + 0.000180, OFFICE_LON));
        }

        @Test
        @DisplayName("Exactly 30 m → no exception (boundary)")
        void exactlyAtRadius_noThrow() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));

            // ~30 m north
            assertThatNoException().isThrownBy(
                    () -> service.validateWithinOfficeRadius(OFFICE_LAT + 0.000270, OFFICE_LON));
        }

        @Test
        @DisplayName("31 m away → throws BusinessException LOCATION_OUT_OF_RANGE")
        void justOutsideRadius_throws() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));

            // ~100 m north (well outside 30 m)
                assertThatThrownBy(
                    () -> service.validateWithinOfficeRadius(OFFICE_LAT + 0.000900, OFFICE_LON))
                    .isInstanceOf(BusinessException.class)
                    .extracting("errorCode")
                    .isEqualTo("LOCATION_OUT_OF_RANGE");
        }

        @Test
        @DisplayName("Multiple branches → can check-in in any of them")
        void multipleBranches_canCheckInAny() {
            var hcm = createOffice("HCM", OFFICE_LAT, OFFICE_LON, RADIUS_M);
            var hanoi = createOffice("Hanoi", BRANCH_LAT, BRANCH_LON, BRANCH_RADIUS);
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(hcm, hanoi));

            // Should be able to check-in in Hanoi
            assertThatNoException().isThrownBy(
                    () -> service.validateWithinOfficeRadius(BRANCH_LAT, BRANCH_LON));
            
            // Should be able to check-in in HCM
            assertThatNoException().isThrownBy(
                    () -> service.validateWithinOfficeRadius(OFFICE_LAT, OFFICE_LON));
        }
    }

    // ─── isWithinOfficeRadius helper ─────────────────────────────────────────

    @Nested
    @DisplayName("isWithinOfficeRadius()")
    class IsWithin {

        @Test
        @DisplayName("Inside radius → true")
        void insideReturnsTrue() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));
            assertThat(service.isWithinOfficeRadius(OFFICE_LAT + 0.000100, OFFICE_LON)).isTrue();
        }

        @Test
        @DisplayName("Outside radius → false")
        void outsideReturnsFalse() {
            org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                    .thenReturn(java.util.List.of(createOffice("Main", OFFICE_LAT, OFFICE_LON, RADIUS_M)));
            assertThat(service.isWithinOfficeRadius(OFFICE_LAT + 0.009, OFFICE_LON)).isFalse();
        }
    }

    // ─── distanceToClosestOffice ─────────────────────────────────────────────────────

    @Test
    @DisplayName("distanceToClosestOffice() == calculateDistance() from closest office to point")
    void distanceToClosestOffice_consistentWithCalculate() {
        var hcm = createOffice("HCM", OFFICE_LAT, OFFICE_LON, RADIUS_M);
        var hanoi = createOffice("Hanoi", BRANCH_LAT, BRANCH_LON, BRANCH_RADIUS);
        org.mockito.Mockito.when(officeLocationRepository.findByIsActiveTrue())
                .thenReturn(java.util.List.of(hcm, hanoi));

        double lat = OFFICE_LAT + 0.001;
        double lon = OFFICE_LON + 0.001;
        double expected = service.calculateDistance(lat, lon, OFFICE_LAT, OFFICE_LON);
        assertThat(service.distanceToClosestOffice(lat, lon)).isCloseTo(expected, within(0.001));
    }
}
