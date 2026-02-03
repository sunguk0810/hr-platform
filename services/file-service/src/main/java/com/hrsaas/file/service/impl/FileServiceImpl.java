package com.hrsaas.file.service.impl;

import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.file.domain.entity.FileMetadata;
import com.hrsaas.file.domain.entity.StorageType;
import com.hrsaas.file.repository.FileMetadataRepository;
import com.hrsaas.file.service.FileService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileServiceImpl implements FileService {

    private final FileMetadataRepository fileMetadataRepository;

    @Value("${file.upload.path:./uploads}")
    private String uploadPath;

    @Value("${file.max-size:104857600}")
    private long maxFileSize;

    @Override
    @Transactional
    public FileResponse upload(MultipartFile file, String referenceType, UUID referenceId,
                                UUID uploaderId, String uploaderName, Boolean isPublic) {
        validateFile(file);

        UUID tenantId = TenantContext.getCurrentTenant();
        String storedName = generateStoredName(file.getOriginalFilename());
        String storagePath = generateStoragePath(tenantId, storedName);

        try {
            Path targetPath = Paths.get(uploadPath, storagePath);
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String checksum = calculateChecksum(file.getBytes());

            FileMetadata metadata = FileMetadata.builder()
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(storagePath)
                .storageType(StorageType.LOCAL)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .uploaderId(uploaderId)
                .uploaderName(uploaderName)
                .isPublic(isPublic != null ? isPublic : false)
                .checksum(checksum)
                .build();

            FileMetadata saved = fileMetadataRepository.save(metadata);

            log.info("File uploaded: id={}, originalName={}, size={}", saved.getId(), file.getOriginalFilename(), file.getSize());
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
            Path filePath = Paths.get(uploadPath, metadata.getStoragePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                metadata.incrementDownloadCount();
                fileMetadataRepository.save(metadata);

                log.info("File downloaded: id={}, originalName={}", id, metadata.getOriginalName());
                return resource;
            } else {
                throw new NotFoundException("FILE_002", "파일을 찾을 수 없습니다: " + metadata.getOriginalName());
            }
        } catch (MalformedURLException e) {
            throw new BusinessException("FILE_003", "파일 경로가 올바르지 않습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public String getPresignedUrl(UUID id, int expirationMinutes) {
        FileMetadata metadata = findById(id);

        // 로컬 스토리지의 경우 간단한 다운로드 URL 반환
        // 실제 S3 연동 시 AWS SDK로 presigned URL 생성
        return "/api/v1/files/" + id + "/download";
    }

    @Override
    @Transactional
    public void delete(UUID id, UUID requesterId) {
        FileMetadata metadata = findById(id);

        if (!metadata.getUploaderId().equals(requesterId)) {
            throw new ForbiddenException("FILE_004", "본인이 업로드한 파일만 삭제할 수 있습니다");
        }

        try {
            Path filePath = Paths.get(uploadPath, metadata.getStoragePath());
            Files.deleteIfExists(filePath);

            fileMetadataRepository.delete(metadata);
            log.info("File deleted: id={}, originalName={}", id, metadata.getOriginalName());

        } catch (IOException e) {
            log.error("File delete failed: {}", e.getMessage());
            throw new BusinessException("FILE_005", "파일 삭제에 실패했습니다", HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
            throw new BusinessException("FILE_007", "파일 크기가 제한을 초과했습니다. 최대: " + (maxFileSize / 1024 / 1024) + "MB", HttpStatus.BAD_REQUEST);
        }
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
