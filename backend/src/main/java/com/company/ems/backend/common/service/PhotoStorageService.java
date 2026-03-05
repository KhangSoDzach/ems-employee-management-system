package com.company.ems.backend.common.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.company.ems.backend.config.StorageProperties;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service responsible for persisting Base64-encoded attendance photos
 * to the local filesystem.
 *
 * <p>Directory layout:
 * <pre>
 *   {photoDir}/
 *     2026/
 *       03/
 *         04/
 *           &lt;uuid&gt;.jpg
 * </pre>
 *
 * <p>Returns a relative path (e.g. {@code 2026/03/04/<uuid>.jpg}) that the caller
 * should store in the database.  To serve files, expose the root photoDir via a
 * static resource handler or an object-storage CDN in production.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhotoStorageService {

    private static final String JPEG_PREFIX = "data:image/jpeg;base64,";
    private static final String PNG_PREFIX  = "data:image/png;base64,";

    private final StorageProperties storageProps;

    @PostConstruct
    public void init() {
        try {
            Path root = Paths.get(storageProps.getPhotoDir());
            Files.createDirectories(root);
            log.info("Photo storage root initialised at: {}", root.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create photo storage directory: {}", e.getMessage(), e);
        }
    }

    /**
     * Saves a Base64-encoded photo to disk.
     *
     * @param base64Photo Base64 string (with or without data-URL prefix)
     * @param subdirectory Optional sub-folder name (e.g. employee code)
     * @return relative path to the stored file (to be persisted in DB)
     * @throws IllegalArgumentException if {@code base64Photo} is blank
     * @throws RuntimeException if the file cannot be written
     */
    public String savePhoto(String base64Photo, String subdirectory) {
        if (base64Photo == null || base64Photo.isBlank()) {
            throw new IllegalArgumentException("Photo data must not be empty.");
        }

        // Strip data-URL prefix if present
        String pureBase64 = stripDataUrlPrefix(base64Photo);
        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(pureBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 photo data.", e);
        }

        // Build date-partitioned path
        LocalDate today = LocalDate.now();
        String dateFolder = String.format("%04d/%02d/%02d", today.getYear(),
                today.getMonthValue(), today.getDayOfMonth());

        Path dir = Paths.get(storageProps.getPhotoDir(), dateFolder);
        if (subdirectory != null && !subdirectory.isBlank()) {
            dir = dir.resolve(subdirectory.replaceAll("[^a-zA-Z0-9_\\-]", "_"));
        }

        try {
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + ".jpg";
            Path filePath   = dir.resolve(filename);
            Files.write(filePath, imageBytes);

            // Return relative path only
            String relativePath = Paths.get(storageProps.getPhotoDir())
                    .relativize(filePath).toString().replace('\\', '/');
            log.debug("Stored attendance photo at: {}", filePath.toAbsolutePath());
            return relativePath;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save attendance photo: " + e.getMessage(), e);
        }
    }

    /**
     * Convenience overload without subdirectory.
     */
    public String savePhoto(String base64Photo) {
        return savePhoto(base64Photo, null);
    }

    /**
     * Deletes a previously stored photo file.  Failures are logged but not propagated.
     */
    public void deletePhoto(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            Path filePath = Paths.get(storageProps.getPhotoDir(), relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Could not delete photo [{}]: {}", relativePath, e.getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    private String stripDataUrlPrefix(String base64) {
        if (base64.startsWith(JPEG_PREFIX)) return base64.substring(JPEG_PREFIX.length());
        if (base64.startsWith(PNG_PREFIX))  return base64.substring(PNG_PREFIX.length());
        return base64;
    }
}
