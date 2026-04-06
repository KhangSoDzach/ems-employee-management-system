package com.company.ems.backend.attendance.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.attendance.dto.OfficeConfigRequest;
import com.company.ems.backend.attendance.dto.OfficeConfigResponse;
import com.company.ems.backend.common.entity.SystemConfig;
import com.company.ems.backend.common.repository.SystemConfigRepository;
import com.company.ems.backend.config.OfficeLocationProperties;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    static final String KEY_SHIFT_1_CHECK_IN = "SHIFT_1_CHECK_IN";
    static final String KEY_SHIFT_1_CHECK_OUT = "SHIFT_1_CHECK_OUT";
    static final String KEY_SHIFT_2_CHECK_IN = "SHIFT_2_CHECK_IN";
    static final String KEY_SHIFT_2_CHECK_OUT = "SHIFT_2_CHECK_OUT";
    static final String KEY_GRACE_PERIOD = "ATTENDANCE_GRACE_PERIOD";
    static final String KEY_EARLY_LEAVE_THRESHOLD = "ATTENDANCE_EARLY_LEAVE_THRESHOLD";

    private static final String SOURCE_DATABASE = "DATABASE";
    private static final String SOURCE_YAML_DEFAULT = "YAML_DEFAULT";

    private final SystemConfigRepository configRepository;
    private final OfficeLocationProperties officeProps;

    // ── Bootstrap: apply DB overrides on startup ──────────────────────────────

    @PostConstruct
    public void loadFromDatabase() {
        try {
            configRepository.findByConfigKey(KEY_LATITUDE).ifPresent(cfg -> officeProps.setLatitude(Double.parseDouble(cfg.getConfigValue())));
            configRepository.findByConfigKey(KEY_LONGITUDE).ifPresent(cfg -> officeProps.setLongitude(Double.parseDouble(cfg.getConfigValue())));
            configRepository.findByConfigKey(KEY_RADIUS_METERS).ifPresent(cfg -> officeProps.setRadiusMeters(Double.parseDouble(cfg.getConfigValue())));
            configRepository.findByConfigKey(KEY_SHIFT_1_CHECK_IN).ifPresent(cfg -> officeProps.setShift1CheckIn(cfg.getConfigValue()));
            configRepository.findByConfigKey(KEY_SHIFT_1_CHECK_OUT).ifPresent(cfg -> officeProps.setShift1CheckOut(cfg.getConfigValue()));
            configRepository.findByConfigKey(KEY_SHIFT_2_CHECK_IN).ifPresent(cfg -> officeProps.setShift2CheckIn(cfg.getConfigValue()));
            configRepository.findByConfigKey(KEY_SHIFT_2_CHECK_OUT).ifPresent(cfg -> officeProps.setShift2CheckOut(cfg.getConfigValue()));
            configRepository.findByConfigKey(KEY_GRACE_PERIOD).ifPresent(cfg -> officeProps.setGracePeriod(Integer.parseInt(cfg.getConfigValue())));
            configRepository.findByConfigKey(KEY_EARLY_LEAVE_THRESHOLD).ifPresent(cfg -> officeProps.setEarlyLeaveThreshold(Integer.parseInt(cfg.getConfigValue())));

            log.info("Office and attendance config loaded from DB.");
        } catch (Exception e) {
            log.warn("Could not load office config from database: {}", e.getMessage());
        }
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OfficeConfigResponse getOfficeConfig() {
        Optional<SystemConfig> latCfg = configRepository.findByConfigKey(KEY_LATITUDE);
        boolean fromDb = latCfg.isPresent();

        return OfficeConfigResponse.builder()
                .latitude(officeProps.getLatitude())
                .longitude(officeProps.getLongitude())
                .radiusMeters(officeProps.getRadiusMeters())
                .shift1CheckIn(officeProps.getShift1CheckIn())
                .shift1CheckOut(officeProps.getShift1CheckOut())
                .shift2CheckIn(officeProps.getShift2CheckIn())
                .shift2CheckOut(officeProps.getShift2CheckOut())
                .gracePeriod(officeProps.getGracePeriod())
                .earlyLeaveThreshold(officeProps.getEarlyLeaveThreshold())
                .updatedAt(fromDb ? latCfg.get().getUpdatedAt() : null)
                .updatedBy(fromDb ? latCfg.get().getUpdatedBy() : null)
                .source(fromDb ? SOURCE_DATABASE : SOURCE_YAML_DEFAULT)
                .build();
    }

    // ── Manual update ─────────────────────────────────────────────────────────

    @Override
    public OfficeConfigResponse updateManual(OfficeConfigRequest request, String updatedBy) {
        if (request.getLatitude() != null) {
            persist(KEY_LATITUDE, String.valueOf(request.getLatitude()), "Vĩ độ văn phòng", updatedBy);
            officeProps.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            persist(KEY_LONGITUDE, String.valueOf(request.getLongitude()), "Kinh độ văn phòng", updatedBy);
            officeProps.setLongitude(request.getLongitude());
        }
        if (request.getRadiusMeters() != null) {
            persist(KEY_RADIUS_METERS, String.valueOf(request.getRadiusMeters()), "Bán kính cho phép checkin (m)", updatedBy);
            officeProps.setRadiusMeters(request.getRadiusMeters());
        }
        if (request.getShift1CheckIn() != null) {
            persist(KEY_SHIFT_1_CHECK_IN, request.getShift1CheckIn(), "Giờ vào ca 1", updatedBy);
            officeProps.setShift1CheckIn(request.getShift1CheckIn());
        }
        if (request.getShift1CheckOut() != null) {
            persist(KEY_SHIFT_1_CHECK_OUT, request.getShift1CheckOut(), "Giờ tan ca 1", updatedBy);
            officeProps.setShift1CheckOut(request.getShift1CheckOut());
        }
        if (request.getShift2CheckIn() != null) {
            persist(KEY_SHIFT_2_CHECK_IN, request.getShift2CheckIn(), "Giờ vào ca 2", updatedBy);
            officeProps.setShift2CheckIn(request.getShift2CheckIn());
        }
        if (request.getShift2CheckOut() != null) {
            persist(KEY_SHIFT_2_CHECK_OUT, request.getShift2CheckOut(), "Giờ tan ca 2", updatedBy);
            officeProps.setShift2CheckOut(request.getShift2CheckOut());
        }
        if (request.getGracePeriod() != null) {
            persist(KEY_GRACE_PERIOD, String.valueOf(request.getGracePeriod()), "Thời gian đi muộn cho phép (phút)", updatedBy);
            officeProps.setGracePeriod(request.getGracePeriod());
        }
        if (request.getEarlyLeaveThreshold() != null) {
            persist(KEY_EARLY_LEAVE_THRESHOLD, String.valueOf(request.getEarlyLeaveThreshold()), "Thời gian về sớm cho phép (phút)", updatedBy);
            officeProps.setEarlyLeaveThreshold(request.getEarlyLeaveThreshold());
        }

        log.info("Office/Attendance config updated by [{}]", updatedBy);
        return buildResponse(updatedBy);
    }

    // ── Auto update ───────────────────────────────────────────────────────────

    @Override
    public OfficeConfigResponse updateAuto(OfficeConfigRequest request, String updatedBy) {
        return updateManual(request, updatedBy); // Auto update usually only sets location, but manual covers it all
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
                .shift1CheckIn(officeProps.getShift1CheckIn())
                .shift1CheckOut(officeProps.getShift1CheckOut())
                .shift2CheckIn(officeProps.getShift2CheckIn())
                .shift2CheckOut(officeProps.getShift2CheckOut())
                .gracePeriod(officeProps.getGracePeriod())
                .earlyLeaveThreshold(officeProps.getEarlyLeaveThreshold())
                .updatedAt(java.time.LocalDateTime.now())
                .updatedBy(updatedBy)
                .source(SOURCE_DATABASE)
                .build();
    }
}
