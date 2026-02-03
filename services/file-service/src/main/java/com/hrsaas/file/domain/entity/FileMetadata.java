package com.hrsaas.file.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "file_metadata", schema = "hr_file")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FileMetadata extends TenantAwareEntity {

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "bucket_name")
    private String bucketName;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type", nullable = false)
    @Builder.Default
    private StorageType storageType = StorageType.S3;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "uploader_id", nullable = false)
    private UUID uploaderId;

    @Column(name = "uploader_name")
    private String uploaderName;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    private Integer downloadCount = 0;

    @Column(name = "checksum")
    private String checksum;

    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public String getFullStoragePath() {
        if (storageType == StorageType.S3) {
            return "s3://" + bucketName + "/" + storagePath;
        }
        return storagePath;
    }
}
