package com.hrsaas.file.storage;

import com.hrsaas.file.domain.entity.StorageType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local file system storage strategy.
 */
@Slf4j
@Component
public class LocalStorageStrategy implements StorageStrategy {

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @Value("${file.download.base-url:/api/v1/files}")
    private String downloadBaseUrl;

    @Override
    public StorageResult store(InputStream inputStream, String storagePath, String contentType, long fileSize) {
        try {
            Path targetPath = Paths.get(uploadPath, storagePath);
            Files.createDirectories(targetPath.getParent());
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.debug("File stored locally: path={}", storagePath);
            return new StorageResult(storagePath, null, StorageType.LOCAL);
        } catch (IOException e) {
            log.error("Failed to store file locally: path={}, error={}", storagePath, e.getMessage());
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public InputStream retrieve(String storagePath) {
        try {
            Path filePath = Paths.get(uploadPath, storagePath);
            if (!Files.exists(filePath)) {
                throw new RuntimeException("File not found: " + storagePath);
            }
            return new FileInputStream(filePath.toFile());
        } catch (IOException e) {
            log.error("Failed to retrieve file: path={}, error={}", storagePath, e.getMessage());
            throw new RuntimeException("Failed to retrieve file", e);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        try {
            Path filePath = Paths.get(uploadPath, storagePath);
            boolean deleted = Files.deleteIfExists(filePath);
            log.debug("File deleted: path={}, deleted={}", storagePath, deleted);
            return deleted;
        } catch (IOException e) {
            log.error("Failed to delete file: path={}, error={}", storagePath, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean exists(String storagePath) {
        Path filePath = Paths.get(uploadPath, storagePath);
        return Files.exists(filePath);
    }

    @Override
    public String generatePresignedUrl(String storagePath, int expirationMinutes) {
        // Local storage doesn't support pre-signed URLs
        // Return a simple download URL
        return downloadBaseUrl + "/download?path=" + storagePath;
    }

    @Override
    public StorageType getStorageType() {
        return StorageType.LOCAL;
    }
}
