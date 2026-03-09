package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.OfficeConfigRequest;
import com.company.ems.backend.attendance.dto.OfficeConfigResponse;
import com.company.ems.backend.common.entity.SystemConfig;
import com.company.ems.backend.common.repository.SystemConfigRepository;
import com.company.ems.backend.config.OfficeLocationProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Implementation of {@link OfficeConfigService}.
 *
 * <p>
 * On startup, reads any persisted office config from {@code system_configs}
 * and applies it to the in-memory {@link OfficeLocationProperties} bean, making
 * DB values take precedence without an application restart.
 *
 * <p>
 * On each update, both the DB and the in-memory bean are updated atomically
 * so that changes take effect immediately (across the same JVM instance).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OfficeConfigServiceImpl implements OfficeConfigService {

    // ── Config keys stored in system_configs ──────────────────────────────────
    static final String KEY_LATITUDE = "OFFICE_LATITUDE";
    static final String KEY_LONGITUDE = "OFFICE_LONGITUDE";
    static final String KEY_RADIUS_METERS = "OFFICE_RADIUS_METERS";

    private static final String SOURCE_DATABASE = "DATABASE";
    private static final String SOURCE_YAML_DEFAULT = "YAML_DEFAULT";

    private final SystemConfigRepository configRepository;
    private final OfficeLocationProperties officeProps;

    // ── Bootstrap: apply DB overrides on startup ──────────────────────────────

    @PostConstruct
    public void loadFromDatabase() {
        Optional<SystemConfig> latCfg = configRepository.findByConfigKey(KEY_LATITUDE);
        Optional<SystemConfig> lonCfg = configRepository.findByConfigKey(KEY_LONGITUDE);

        if (latCfg.isPresent() && lonCfg.isPresent()) {
            double lat = Double.parseDouble(latCfg.get().getConfigValue());
            double lon = Double.parseDouble(lonCfg.get().getConfigValue());
            officeProps.setLatitude(lat);
            officeProps.setLongitude(lon);
            log.info("Office location loaded from DB → lat={}, lon={}", lat, lon);
        }
        configRepository.findByConfigKey(KEY_RADIUS_METERS).ifPresent(cfg -> {
            double radius = Double.parseDouble(cfg.getConfigValue());
            officeProps.setRadiusMeters(radius);
            log.info("Office radius loaded from DB → {}m", radius);
        });
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OfficeConfigResponse getOfficeConfig() {
        Optional<SystemConfig> latCfg = configRepository.findByConfigKey(KEY_LATITUDE);
        Optional<SystemConfig> lonCfg = configRepository.findByConfigKey(KEY_LONGITUDE);
        Optional<SystemConfig> radCfg = configRepository.findByConfigKey(KEY_RADIUS_METERS);

        boolean fromDb = latCfg.isPresent() && lonCfg.isPresent();

        return OfficeConfigResponse.builder()
                .latitude(officeProps.getLatitude())
                .longitude(officeProps.getLongitude())
                .radiusMeters(officeProps.getRadiusMeters())
                .updatedAt(fromDb ? latCfg.get().getUpdatedAt() : null)
                .updatedBy(fromDb ? latCfg.get().getUpdatedBy() : null)
                .source(fromDb ? SOURCE_DATABASE : SOURCE_YAML_DEFAULT)
                .build();
    }

    // ── Manual update ─────────────────────────────────────────────────────────

    @Override
    public OfficeConfigResponse updateManual(OfficeConfigRequest request, String updatedBy) {
        double lat = request.getLatitude();
        double lon = request.getLongitude();
        double radius = request.getRadiusMeters() != null
                ? request.getRadiusMeters()
                : officeProps.getRadiusMeters();

        persist(KEY_LATITUDE, String.valueOf(lat), "Vĩ độ văn phòng", updatedBy);
        persist(KEY_LONGITUDE, String.valueOf(lon), "Kinh độ văn phòng", updatedBy);
        persist(KEY_RADIUS_METERS, String.valueOf(radius), "Bán kính cho phép checkin (m)", updatedBy);

        // Apply to in-memory bean immediately
        officeProps.setLatitude(lat);
        officeProps.setLongitude(lon);
        officeProps.setRadiusMeters(radius);

        log.info("Office location updated manually by [{}] → lat={}, lon={}, radius={}m",
                updatedBy, lat, lon, radius);

        return buildResponse(updatedBy);
    }

    // ── Auto update ───────────────────────────────────────────────────────────

    @Override
    public OfficeConfigResponse updateAuto(OfficeConfigRequest request, String updatedBy) {
        double lat = request.getLatitude();
        double lon = request.getLongitude();
        // Keep existing radius unless explicitly provided
        double radius = request.getRadiusMeters() != null
                ? request.getRadiusMeters()
                : officeProps.getRadiusMeters();

        persist(KEY_LATITUDE, String.valueOf(lat), "Vĩ độ văn phòng (tự động)", updatedBy);
        persist(KEY_LONGITUDE, String.valueOf(lon), "Kinh độ văn phòng (tự động)", updatedBy);
        persist(KEY_RADIUS_METERS, String.valueOf(radius), "Bán kính cho phép checkin (m)", updatedBy);

        officeProps.setLatitude(lat);
        officeProps.setLongitude(lon);
        officeProps.setRadiusMeters(radius);

        log.info("Office location auto-set by [{}] → lat={}, lon={}, radius={}m",
                updatedBy, lat, lon, radius);

        return buildResponse(updatedBy);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Upserts a single config row identified by {@code key}.
     */
    private void persist(String key, String value, String description, String updatedBy) {
        SystemConfig cfg = configRepository.findByConfigKey(key)
                .orElse(SystemConfig.builder().configKey(key).build());
        cfg.setConfigValue(value);
        cfg.setDescription(description);
        cfg.setUpdatedBy(updatedBy);
        configRepository.save(cfg);
    }

    private OfficeConfigResponse buildResponse(String updatedBy) {
        return OfficeConfigResponse.builder()
                .latitude(officeProps.getLatitude())
                .longitude(officeProps.getLongitude())
                .radiusMeters(officeProps.getRadiusMeters())
                .updatedAt(java.time.LocalDateTime.now())
                .updatedBy(updatedBy)
                .source(SOURCE_DATABASE)
                .build();
    }
}
