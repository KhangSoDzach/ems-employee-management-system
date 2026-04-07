package com.company.ems.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configures the Spring async executor used by {@code @Async} methods
 * throughout the application (e.g. email notification after employee creation).
 *
 * <p>All pool parameters are externalized via {@code application.yaml}
 * under {@code app.async.*} so they can be tuned per environment without
 * code changes.
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    /** Minimum number of threads kept alive in the pool. */
    @Value("${app.async.core-pool-size:2}")
    private int corePoolSize;

    /** Maximum number of threads the pool can grow to. */
    @Value("${app.async.max-pool-size:5}")
    private int maxPoolSize;

    /** Capacity of the task queue before new threads are created. */
    @Value("${app.async.queue-capacity:100}")
    private int queueCapacity;

    /** Thread name prefix for easier log identification. */
    @Value("${app.async.thread-name-prefix:ems-async-}")
    private String threadNamePrefix;

    /**
     * Primary async executor bean.
     * Named {@code "taskExecutor"} so Spring's {@code @Async} proxy picks it
     * up automatically when no explicit executor is specified.
     */
    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix(threadNamePrefix);
        executor.initialize();
        return executor;
    }
}
