package com.hrsaas.file.service.impl;

import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.file.domain.entity.FileMetadata;
import com.hrsaas.file.domain.entity.StorageType;
import com.hrsaas.file.repository.FileMetadataRepository;
import com.hrsaas.file.service.FileService;
import com.hrsaas.file.storage.StorageService;
import com.hrsaas.file.storage.StorageStrategy;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileServiceImpl implements FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final StorageService storageService;

    @Value("${file.max-size:104857600}")
    private long maxFileSize;

    /**
     * 파일 확장자 화이트리스트 — 허용되지 않은 확장자의 업로드를 차단
     */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv", ".rtf", ".odt", ".ods",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp",
        ".zip", ".7z", ".tar", ".gz",
        ".mp3", ".mp4", ".avi", ".mov",
        ".hwp", ".hwpx"
    );

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
        ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif",
        ".vbs", ".vbe", ".js", ".jse", ".wsf", ".wsh",
        ".ps1", ".psm1", ".reg", ".inf", ".lnk",
        ".dll", ".sys", ".drv", ".cpl"
    );

    @Override
    @Transactional
    public FileResponse upload(MultipartFile file, String referenceType, UUID referenceId,
                                UUID uploaderId, String uploaderName, Boolean isPublic) {
        validateFile(file);

        UUID tenantId = TenantContext.getCurrentTenant();
        String storedName = generateStoredName(file.getOriginalFilename());
        String storagePath = generateStoragePath(tenantId, storedName);

        try {
            String checksum = calculateChecksum(file.getBytes());

            // Use storage service to store file
            StorageStrategy.StorageResult result = storageService.store(
                file.getInputStream(),
                storagePath,
                file.getContentType(),
                file.getSize()
            );

            FileMetadata metadata = FileMetadata.builder()
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(result.path())
                .bucketName(result.bucket())
                .storageType(result.storageType())
                .referenceType(referenceType)
                .referenceId(referenceId)
                .uploaderId(uploaderId)
                .uploaderName(uploaderName)
                .isPublic(isPublic != null ? isPublic : false)
                .checksum(checksum)
                .build();

            FileMetadata saved = fileMetadataRepository.save(metadata);

            log.info("File uploaded: id={}, originalName={}, size={}, storageType={}",
                saved.getId(), file.getOriginalFilename(), file.getSize(), result.storageType());
            return FileResponse.from(saved);

        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            throw new BusinessException("FILE_001", "파일 업로드에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional
    public List<FileResponse> uploadMultiple(List<MultipartFile> files, String referenceType, UUID referenceId,
                                              UUID uploaderId, String uploaderName, Boolean isPublic) {
        List<FileResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            responses.add(upload(file, referenceType, referenceId, uploaderId, uploaderName, isPublic));
        }
        return responses;
    }

    @Override
    public FileResponse getById(UUID id) {
        FileMetadata metadata = findById(id);
        return FileResponse.from(metadata);
    }

    @Override
    public List<FileResponse> getByReference(String referenceType, UUID referenceId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<FileMetadata> files = fileMetadataRepository.findByReference(tenantId, referenceType, referenceId);
        return files.stream()
            .map(FileResponse::from)
            .toList();
    }

    @Override
    public PageResponse<FileResponse> getMyFiles(UUID uploaderId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<FileMetadata> page = fileMetadataRepository.findByUploaderId(tenantId, uploaderId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(FileResponse::from)
            .toList());
    }

    @Override
    @Transactional
    public Resource download(UUID id) {
        FileMetadata metadata = findById(id);

        try {
            InputStream inputStream = storageService.retrieve(
                metadata.getStoragePath(),
                metadata.getStorageType()
            );

            metadata.incrementDownloadCount();
            fileMetadataRepository.save(metadata);

            log.info("File downloaded: id={}, originalName={}, storageType={}",
                id, metadata.getOriginalName(), metadata.getStorageType());
            return new InputStreamResource(inputStream);
        } catch (Exception e) {
            log.error("File download failed: id={}, error={}", id, e.getMessage());
            throw new NotFoundException("FILE_002", "파일을 찾을 수 없습니다: " + metadata.getOriginalName());
        }
    }

    @Override
    public String getPresignedUrl(UUID id, int expirationMinutes) {
        FileMetadata metadata = findById(id);

        return storageService.generatePresignedUrl(
            metadata.getStoragePath(),
            metadata.getStorageType(),
            expirationMinutes
        );
    }

    @Override
    @Transactional
    public void delete(UUID id, UUID requesterId) {
        delete(id, requesterId, false);
    }

    @Override
    @Transactional
    public void delete(UUID id, UUID requesterId, boolean isAdmin) {
        FileMetadata metadata = findById(id);

        if (!isAdmin && !metadata.getUploaderId().equals(requesterId)) {
            throw new ForbiddenException("FILE_004", "본인이 업로드한 파일만 삭제할 수 있습니다");
        }

        boolean deleted = storageService.delete(
            metadata.getStoragePath(),
            metadata.getStorageType()
        );

        if (!deleted) {
            log.warn("Physical file deletion failed, but continuing with metadata deletion: id={}", id);
        }

        fileMetadataRepository.delete(metadata);
        log.info("File deleted: id={}, originalName={}, storageType={}, byAdmin={}",
            id, metadata.getOriginalName(), metadata.getStorageType(), isAdmin);
    }

    private FileMetadata findById(UUID id) {
        return fileMetadataRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("FILE_002", "파일을 찾을 수 없습니다: " + id));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("FILE_006", "파일이 비어있습니다", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > maxFileSize) {
            throw new BusinessException("FILE_007",
                "파일 크기가 제한을 초과했습니다. 최대: " + (maxFileSize / 1024 / 1024) + "MB",
                HttpStatus.BAD_REQUEST);
        }

        // Extension whitelist validation
        String extension = getFileExtension(file.getOriginalFilename());
        if (extension != null) {
            String extLower = extension.toLowerCase();
            if (BLOCKED_EXTENSIONS.contains(extLower)) {
                throw new BusinessException("FILE_008",
                    "보안상 허용되지 않는 파일 형식입니다: " + extension,
                    HttpStatus.BAD_REQUEST);
            }
            if (!ALLOWED_EXTENSIONS.contains(extLower)) {
                throw new BusinessException("FILE_009",
                    "허용되지 않는 파일 확장자입니다: " + extension +
                    ". 허용 확장자: pdf, doc, docx, xls, xlsx, ppt, pptx, jpg, png, gif, hwp 등",
                    HttpStatus.BAD_REQUEST);
            }
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return null;
        return filename.substring(filename.lastIndexOf("."));
    }

    private String generateStoredName(String originalName) {
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    private String generateStoragePath(UUID tenantId, String storedName) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        return tenantId.toString() + "/" + datePath + "/" + storedName;
    }

    private String calculateChecksum(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            return null;
        }
    }
}
