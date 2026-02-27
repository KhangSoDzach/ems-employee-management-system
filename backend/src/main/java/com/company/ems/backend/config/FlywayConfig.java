package com.company.ems.backend.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairAndMigrate() {
        return (Flyway flyway) -> {
            log.info("Flyway: Running repair() to clean up failed migrations and fix checksums...");
            flyway.repair();
            log.info("Flyway: repair() completed. Starting migrate()...");
            flyway.migrate();
            log.info("Flyway: migrate() completed successfully.");
        };
    }
}
