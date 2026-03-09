package com.company.ems.backend.config;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration
 * Configures CORS to allow frontend (React) to access the API
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    /**
     * Serve attendance photos as static resources.
     * Maps GET /uploads/attendance-photos/** → file:{photoDir}/
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String photoDir = storageProperties.getPhotoDir();
        // Ensure trailing separator for resource locations
        if (!photoDir.endsWith("/") && !photoDir.endsWith("\\")) {
            photoDir = photoDir + "/";
        }
        registry.addResourceHandler("/uploads/attendance-photos/**")
                .addResourceLocations("file:" + photoDir);
    }

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:5174")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
