package com.hrsaas.file.storage;

import com.hrsaas.file.domain.entity.StorageType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.InputStream;
import java.time.Duration;

/**
 * AWS S3 storage strategy.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class S3StorageStrategy implements StorageStrategy {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket:hr-saas-files}")
    private String defaultBucket;

    @Override
    public StorageResult store(InputStream inputStream, String storagePath, String contentType, long fileSize) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(defaultBucket)
                .key(storagePath)
                .contentType(contentType)
                .contentLength(fileSize)
                .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, fileSize));

            log.info("File stored in S3: bucket={}, key={}", defaultBucket, storagePath);
            return new StorageResult(storagePath, defaultBucket, StorageType.S3);
        } catch (Exception e) {
            log.error("Failed to store file in S3: key={}, error={}", storagePath, e.getMessage());
            throw new RuntimeException("Failed to store file in S3", e);
        }
    }

    @Override
    public InputStream retrieve(String storagePath) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(defaultBucket)
                .key(storagePath)
                .build();

            return s3Client.getObject(getObjectRequest);
        } catch (NoSuchKeyException e) {
            log.error("File not found in S3: key={}", storagePath);
            throw new RuntimeException("File not found: " + storagePath);
        } catch (Exception e) {
            log.error("Failed to retrieve file from S3: key={}, error={}", storagePath, e.getMessage());
            throw new RuntimeException("Failed to retrieve file from S3", e);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(defaultBucket)
                .key(storagePath)
                .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted from S3: bucket={}, key={}", defaultBucket, storagePath);
            return true;
        } catch (Exception e) {
            log.error("Failed to delete file from S3: key={}, error={}", storagePath, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean exists(String storagePath) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                .bucket(defaultBucket)
                .key(storagePath)
                .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Failed to check file existence in S3: key={}, error={}", storagePath, e.getMessage());
            return false;
        }
    }

    @Override
    public String generatePresignedUrl(String storagePath, int expirationMinutes) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(defaultBucket)
                .key(storagePath)
                .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expirationMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String presignedUrl = presignedRequest.url().toString();

            log.debug("Generated presigned URL: key={}, expiration={}min", storagePath, expirationMinutes);
            return presignedUrl;
        } catch (Exception e) {
            log.error("Failed to generate presigned URL: key={}, error={}", storagePath, e.getMessage());
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }

    @Override
    public StorageType getStorageType() {
        return StorageType.S3;
    }
}
