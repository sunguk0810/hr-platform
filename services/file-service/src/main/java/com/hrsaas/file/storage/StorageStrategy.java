package com.hrsaas.file.storage;

import com.hrsaas.file.domain.entity.StorageType;

import java.io.InputStream;

/**
 * Strategy interface for file storage operations.
 */
public interface StorageStrategy {

    /**
     * Stores a file.
     *
     * @param inputStream  The file input stream
     * @param storagePath  The path where the file should be stored
     * @param contentType  The content type of the file
     * @param fileSize     The size of the file in bytes
     * @return The storage result containing the final path
     */
    StorageResult store(InputStream inputStream, String storagePath, String contentType, long fileSize);

    /**
     * Retrieves a file as an InputStream.
     *
     * @param storagePath The path to the file
     * @return The file input stream
     */
    InputStream retrieve(String storagePath);

    /**
     * Deletes a file.
     *
     * @param storagePath The path to the file
     * @return true if deleted successfully
     */
    boolean delete(String storagePath);

    /**
     * Checks if a file exists.
     *
     * @param storagePath The path to the file
     * @return true if the file exists
     */
    boolean exists(String storagePath);

    /**
     * Generates a pre-signed URL for the file.
     *
     * @param storagePath       The path to the file
     * @param expirationMinutes How long the URL should be valid
     * @return The pre-signed URL
     */
    String generatePresignedUrl(String storagePath, int expirationMinutes);

    /**
     * Gets the storage type this strategy handles.
     *
     * @return The storage type
     */
    StorageType getStorageType();

    /**
     * Result of a storage operation.
     */
    record StorageResult(String path, String bucket, StorageType storageType) {}
}
