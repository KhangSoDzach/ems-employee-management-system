package com.company.ems.backend.common.repository;

import com.company.ems.backend.common.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link SystemConfig}.
 */
@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    /** Find a config entry by its unique key. */
    Optional<SystemConfig> findByConfigKey(String configKey);
}
