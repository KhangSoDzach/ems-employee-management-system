package com.company.ems.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing configuration
 * Enables automatic tracking of created/modified dates and users
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    // @Bean
    // public AuditorAware<String> auditorProvider() {
    //     return new AuditorAwareImpl();
    // }
}
