package com.hrsaas.file.storage;

import com.hrsaas.file.domain.entity.StorageType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for managing file storage operations using the appropriate strategy.
 */
@Slf4j
@Service
public class StorageService {

    private final Map<StorageType, StorageStrategy> strategies;
    private final StorageType defaultStorageType;

    public StorageService(List<StorageStrategy> storageStrategies,
                          @Value("${file.storage.default:LOCAL}") String defaultStorage) {
        this.strategies = storageStrategies.stream()
            .collect(Collectors.toMap(
                StorageStrategy::getStorageType,
                Function.identity()
            ));
        this.defaultStorageType = StorageType.valueOf(defaultStorage);

        log.info("StorageService initialized with {} strategies, default: {}",
            strategies.size(), defaultStorageType);
    }

    /**
     * Stores a file using the default storage strategy.
     */
    public StorageStrategy.StorageResult store(InputStream inputStream, String storagePath,
                                               String contentType, long fileSize) {
        return store(inputStream, storagePath, contentType, fileSize, defaultStorageType);
    }

    /**
     * Stores a file using the specified storage strategy.
     */
    public StorageStrategy.StorageResult store(InputStream inputStream, String storagePath,
                                               String contentType, long fileSize, StorageType storageType) {
        StorageStrategy strategy = getStrategy(storageType);
        return strategy.store(inputStream, storagePath, contentType, fileSize);
    }

    /**
     * Retrieves a file from storage.
     */
    public InputStream retrieve(String storagePath, StorageType storageType) {
        StorageStrategy strategy = getStrategy(storageType);
        return strategy.retrieve(storagePath);
    }

    /**
     * Deletes a file from storage.
     */
    public boolean delete(String storagePath, StorageType storageType) {
        StorageStrategy strategy = getStrategy(storageType);
        return strategy.delete(storagePath);
    }

    /**
     * Checks if a file exists in storage.
     */
    public boolean exists(String storagePath, StorageType storageType) {
        StorageStrategy strategy = getStrategy(storageType);
        return strategy.exists(storagePath);
    }

    /**
     * Generates a pre-signed URL for the file.
     */
    public String generatePresignedUrl(String storagePath, StorageType storageType, int expirationMinutes) {
        StorageStrategy strategy = getStrategy(storageType);
        return strategy.generatePresignedUrl(storagePath, expirationMinutes);
    }

    /**
     * Gets the default storage type.
     */
    public StorageType getDefaultStorageType() {
        return defaultStorageType;
    }

    private StorageStrategy getStrategy(StorageType storageType) {
        StorageStrategy strategy = strategies.get(storageType);
        if (strategy == null) {
            throw new IllegalArgumentException("No storage strategy found for type: " + storageType);
        }
        return strategy;
    }
}
