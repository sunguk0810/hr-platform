package com.hrsaas.file.domain.dto.response;

import com.hrsaas.file.domain.entity.FileMetadata;
import com.hrsaas.file.domain.entity.StorageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {

    private UUID id;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private StorageType storageType;
    private String referenceType;
    private UUID referenceId;
    private UUID uploaderId;
    private String uploaderName;
    private Boolean isPublic;
    private Integer downloadCount;
    private Instant createdAt;
    private String downloadUrl;

    public static FileResponse from(FileMetadata metadata) {
        return FileResponse.builder()
            .id(metadata.getId())
            .originalName(metadata.getOriginalName())
            .contentType(metadata.getContentType())
            .fileSize(metadata.getFileSize())
            .storageType(metadata.getStorageType())
            .referenceType(metadata.getReferenceType())
            .referenceId(metadata.getReferenceId())
            .uploaderId(metadata.getUploaderId())
            .uploaderName(metadata.getUploaderName())
            .isPublic(metadata.getIsPublic())
            .downloadCount(metadata.getDownloadCount())
            .createdAt(metadata.getCreatedAt())
            .build();
    }

    public static FileResponse from(FileMetadata metadata, String downloadUrl) {
        FileResponse response = from(metadata);
        response.setDownloadUrl(downloadUrl);
        return response;
    }
}
