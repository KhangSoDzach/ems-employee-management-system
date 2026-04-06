package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.OfficeConfigRequest;
import com.company.ems.backend.attendance.dto.OfficeConfigResponse;
import com.company.ems.backend.common.entity.SystemConfig;
import com.company.ems.backend.common.repository.SystemConfigRepository;
import com.company.ems.backend.config.OfficeLocationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link OfficeConfigServiceImpl}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OfficeConfigServiceImpl – Unit Tests")
class OfficeConfigServiceImplTest {

    @Mock
    SystemConfigRepository configRepository;

    @Mock
    OfficeLocationProperties officeProps;

    @InjectMocks
    OfficeConfigServiceImpl service;

    // ── loadFromDatabase ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("loadFromDatabase() – @PostConstruct")
    class LoadFromDatabase {

        @Test
        @DisplayName("Both lat+lon present → officeProps updated on startup")
        void loadsLatLonFromDb() {
            SystemConfig latCfg = configWith(OfficeConfigServiceImpl.KEY_LATITUDE, "10.78");
            SystemConfig lonCfg = configWith(OfficeConfigServiceImpl.KEY_LONGITUDE, "106.65");

            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_LATITUDE))
                    .thenReturn(Optional.of(latCfg));
            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_LONGITUDE))
                    .thenReturn(Optional.of(lonCfg));
            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_RADIUS_METERS))
                    .thenReturn(Optional.empty());

            service.loadFromDatabase();

            verify(officeProps).setLatitude(10.78);
            verify(officeProps).setLongitude(106.65);
            verify(officeProps, never()).setRadiusMeters(anyDouble());
        }

        @Test
        @DisplayName("Radius present → officeProps radius updated")
        void loadsRadiusFromDb() {
            SystemConfig latCfg = configWith(OfficeConfigServiceImpl.KEY_LATITUDE, "10.78");
            SystemConfig lonCfg = configWith(OfficeConfigServiceImpl.KEY_LONGITUDE, "106.65");
            SystemConfig radCfg = configWith(OfficeConfigServiceImpl.KEY_RADIUS_METERS, "150.0");

            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_LATITUDE))
                    .thenReturn(Optional.of(latCfg));
            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_LONGITUDE))
                    .thenReturn(Optional.of(lonCfg));
            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_RADIUS_METERS))
                    .thenReturn(Optional.of(radCfg));

            service.loadFromDatabase();

            verify(officeProps).setRadiusMeters(150.0);
        }

        @Test
        @DisplayName("No DB rows → officeProps not modified (YAML default stays)")
        void noDbRows_doesNotModifyProps() {
            when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());

            service.loadFromDatabase();

            verify(officeProps, never()).setLatitude(anyDouble());
            verify(officeProps, never()).setLongitude(anyDouble());
            verify(officeProps, never()).setRadiusMeters(anyDouble());
        }
    }

    // ── getOfficeConfig ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getOfficeConfig()")
    class GetOfficeConfig {

        @Test
        @DisplayName("DB rows present → source = DATABASE")
        void returnsDbSource_whenConfigPersisted() {
            SystemConfig latCfg = configWith(OfficeConfigServiceImpl.KEY_LATITUDE, "10.78");

            when(configRepository.findByConfigKey(OfficeConfigServiceImpl.KEY_LATITUDE))
                    .thenReturn(Optional.of(latCfg));
            when(officeProps.getLatitude()).thenReturn(10.78);
            when(officeProps.getLongitude()).thenReturn(106.65);
            when(officeProps.getRadiusMeters()).thenReturn(200.0);

            OfficeConfigResponse resp = service.getOfficeConfig();

            assertThat(resp.getSource()).isEqualTo("DATABASE");
            assertThat(resp.getLatitude()).isEqualTo(10.78);
        }

        @Test
        @DisplayName("No DB rows → source = YAML_DEFAULT")
        void returnsYamlDefault_whenNoDB() {
            when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());
            when(officeProps.getLatitude()).thenReturn(10.8037);
            when(officeProps.getLongitude()).thenReturn(106.6896);
            when(officeProps.getRadiusMeters()).thenReturn(200.0);

            OfficeConfigResponse resp = service.getOfficeConfig();

            assertThat(resp.getSource()).isEqualTo("YAML_DEFAULT");
            assertThat(resp.getUpdatedBy()).isNull();
        }
    }

    // ── updateManual ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateManual()")
    class UpdateManual {

        @Test
        @DisplayName("Saves 3 config rows and updates officeProps")
        void savesThreeRows() {
            OfficeConfigRequest req = OfficeConfigRequest.builder()
                    .latitude(10.78)
                    .longitude(106.65)
                    .radiusMeters(100.0)
                    .build();
            when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(officeProps.getLatitude()).thenReturn(10.78);
            when(officeProps.getLongitude()).thenReturn(106.65);
            when(officeProps.getRadiusMeters()).thenReturn(100.0);

            OfficeConfigResponse resp = service.updateManual(req, "admin");

            // 3 saves: LATITUDE, LONGITUDE, RADIUS_METERS
            verify(configRepository, atLeast(3)).save(any(SystemConfig.class));
            verify(officeProps).setLatitude(10.78);
            verify(officeProps).setLongitude(106.65);
            verify(officeProps).setRadiusMeters(100.0);
            assertThat(resp.getUpdatedBy()).isEqualTo("admin");
            assertThat(resp.getSource()).isEqualTo("DATABASE");
        }

        @Test
        @DisplayName("RadiusMeters null → keeps existing radius from officeProps")
        void keepsExistingRadius_whenNotProvided() {
            OfficeConfigRequest req = OfficeConfigRequest.builder()
                    .latitude(10.78)
                    .longitude(106.65)
                    .radiusMeters(null)
                    .build();
            when(officeProps.getRadiusMeters()).thenReturn(200.0);
            when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(officeProps.getLatitude()).thenReturn(10.78);
            when(officeProps.getLongitude()).thenReturn(106.65);

            ArgumentCaptor<SystemConfig> captor = ArgumentCaptor.forClass(SystemConfig.class);
            service.updateManual(req, "admin");

            // At least 2 saves (LAT, LON)
            verify(configRepository, atLeast(2)).save(captor.capture());
            // Check that LAT update is present
            assertThat(captor.getAllValues().stream()
                    .anyMatch(c -> OfficeConfigServiceImpl.KEY_LATITUDE.equals(c.getConfigKey()) && "10.78".equals(c.getConfigValue())))
                    .isTrue();
        }
    }

    // ── updateAuto ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateAuto()")
    class UpdateAuto {

        @Test
        @DisplayName("Saves lat+lon from request and keeps existing radius")
        void savesLatLon_keepsRadius() {
            OfficeConfigRequest req = OfficeConfigRequest.builder()
                    .latitude(10.80)
                    .longitude(106.70)
                    .radiusMeters(null)
                    .build();
            when(officeProps.getRadiusMeters()).thenReturn(200.0);
            when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());
            when(configRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(officeProps.getLatitude()).thenReturn(10.80);
            when(officeProps.getLongitude()).thenReturn(106.70);

            OfficeConfigResponse resp = service.updateAuto(req, "admin@ems");

            verify(officeProps).setLatitude(10.80);
            verify(officeProps).setLongitude(106.70);
            assertThat(resp.getSource()).isEqualTo("DATABASE");
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private SystemConfig configWith(String key, String value) {
        SystemConfig cfg = new SystemConfig();
        cfg.setConfigKey(key);
        cfg.setConfigValue(value);
        cfg.setUpdatedAt(LocalDateTime.now());
        cfg.setUpdatedBy("admin");
        return cfg;
    }
}
