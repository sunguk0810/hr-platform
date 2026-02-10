package com.hrsaas.file.service.impl;

import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.file.domain.entity.FileMetadata;
import com.hrsaas.file.domain.entity.StorageType;
import com.hrsaas.file.repository.FileMetadataRepository;
import com.hrsaas.file.storage.StorageService;
import com.hrsaas.file.storage.StorageStrategy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private FileServiceImpl fileService;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID UPLOADER_ID = UUID.randomUUID();
    private static final UUID REFERENCE_ID = UUID.randomUUID();
    private static final String UPLOADER_NAME = "TestUser";
    private static final String REFERENCE_TYPE = "EMPLOYEE";

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
        setFieldValue(fileService, "maxFileSize", 104857600L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ========== upload tests ==========

    @Test
    @DisplayName("upload: valid PDF file - successfully uploads and returns response")
    void upload_validFile_success() throws Exception {
        // given
        MultipartFile file = mockMultipartFile("test.pdf", "application/pdf", 1024L);
        StorageStrategy.StorageResult storageResult =
                new StorageStrategy.StorageResult("path/to/file.pdf", "test-bucket", StorageType.LOCAL);
        when(storageService.store(any(InputStream.class), anyString(), anyString(), anyLong()))
                .thenReturn(storageResult);

        FileMetadata savedMetadata = createFileMetadata(UUID.randomUUID(), "test.pdf",
                "application/pdf", 1024L, UPLOADER_ID);
        when(fileMetadataRepository.save(any(FileMetadata.class))).thenReturn(savedMetadata);

        // when
        FileResponse response = fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getOriginalName()).isEqualTo("test.pdf");
        verify(storageService).store(any(InputStream.class), anyString(), anyString(), eq(1024L));
        verify(fileMetadataRepository).save(any(FileMetadata.class));
    }

    @Test
    @DisplayName("upload: empty file - throws BusinessException")
    void upload_emptyFile_throwsException() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("파일이 비어있습니다");
    }

    @Test
    @DisplayName("upload: oversized file - throws BusinessException")
    void upload_oversizedFile_throwsException() {
        // given
        long oversizedFileSize = 104857600L + 1; // maxFileSize + 1
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(oversizedFileSize);

        // when & then
        assertThatThrownBy(() -> fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("파일 크기가 제한을 초과했습니다");
    }

    @Test
    @DisplayName("upload: blocked extension .exe - throws BusinessException")
    void upload_blockedExtension_exe_throwsException() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("malware.exe");

        // when & then
        assertThatThrownBy(() -> fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("보안상 허용되지 않는 파일 형식입니다");
    }

    @Test
    @DisplayName("upload: allowed extension .pdf - successfully uploads")
    void upload_allowedExtension_pdf_success() throws Exception {
        // given
        MultipartFile file = mockMultipartFile("document.pdf", "application/pdf", 2048L);
        StorageStrategy.StorageResult storageResult =
                new StorageStrategy.StorageResult("path/to/document.pdf", "bucket", StorageType.LOCAL);
        when(storageService.store(any(InputStream.class), anyString(), anyString(), anyLong()))
                .thenReturn(storageResult);

        FileMetadata savedMetadata = createFileMetadata(UUID.randomUUID(), "document.pdf",
                "application/pdf", 2048L, UPLOADER_ID);
        when(fileMetadataRepository.save(any(FileMetadata.class))).thenReturn(savedMetadata);

        // when
        FileResponse response = fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getOriginalName()).isEqualTo("document.pdf");
    }

    @Test
    @DisplayName("upload: unknown/unallowed extension .xyz - throws BusinessException")
    void upload_unknownExtension_throwsException() {
        // given
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(1024L);
        when(file.getOriginalFilename()).thenReturn("file.xyz");

        // when & then
        assertThatThrownBy(() -> fileService.upload(file, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("허용되지 않는 파일 확장자입니다");
    }

    // ========== uploadMultiple tests ==========

    @Test
    @DisplayName("uploadMultiple: valid files - returns all responses")
    void uploadMultiple_validFiles_returnsAllResponses() throws Exception {
        // given
        MultipartFile file1 = mockMultipartFile("doc1.pdf", "application/pdf", 1024L);
        MultipartFile file2 = mockMultipartFile("doc2.pdf", "application/pdf", 2048L);
        List<MultipartFile> files = List.of(file1, file2);

        StorageStrategy.StorageResult storageResult =
                new StorageStrategy.StorageResult("path/file", "bucket", StorageType.LOCAL);
        when(storageService.store(any(InputStream.class), anyString(), anyString(), anyLong()))
                .thenReturn(storageResult);

        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        FileMetadata saved1 = createFileMetadata(id1, "doc1.pdf", "application/pdf", 1024L, UPLOADER_ID);
        FileMetadata saved2 = createFileMetadata(id2, "doc2.pdf", "application/pdf", 2048L, UPLOADER_ID);
        when(fileMetadataRepository.save(any(FileMetadata.class)))
                .thenReturn(saved1)
                .thenReturn(saved2);

        // when
        List<FileResponse> responses = fileService.uploadMultiple(files, REFERENCE_TYPE, REFERENCE_ID,
                UPLOADER_ID, UPLOADER_NAME, false);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getOriginalName()).isEqualTo("doc1.pdf");
        assertThat(responses.get(1).getOriginalName()).isEqualTo("doc2.pdf");
        verify(fileMetadataRepository, org.mockito.Mockito.times(2)).save(any(FileMetadata.class));
    }

    // ========== getById tests ==========

    @Test
    @DisplayName("getById: existing file - returns FileResponse")
    void getById_existingFile_returnsResponse() {
        // given
        UUID fileId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "report.pdf",
                "application/pdf", 5000L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        // when
        FileResponse response = fileService.getById(fileId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(fileId);
        assertThat(response.getOriginalName()).isEqualTo("report.pdf");
    }

    @Test
    @DisplayName("getById: non-existent file - throws NotFoundException")
    void getById_nonExistent_throwsNotFoundException() {
        // given
        UUID fileId = UUID.randomUUID();
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> fileService.getById(fileId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("파일을 찾을 수 없습니다");
    }

    // ========== getByReference tests ==========

    @Test
    @DisplayName("getByReference: returns files matching reference")
    void getByReference_returnsFiles() {
        // given
        UUID fileId1 = UUID.randomUUID();
        UUID fileId2 = UUID.randomUUID();
        FileMetadata meta1 = createFileMetadata(fileId1, "doc1.pdf", "application/pdf", 1024L, UPLOADER_ID);
        FileMetadata meta2 = createFileMetadata(fileId2, "doc2.pdf", "application/pdf", 2048L, UPLOADER_ID);
        when(fileMetadataRepository.findByReference(TENANT_ID, REFERENCE_TYPE, REFERENCE_ID))
                .thenReturn(List.of(meta1, meta2));

        // when
        List<FileResponse> responses = fileService.getByReference(REFERENCE_TYPE, REFERENCE_ID);

        // then
        assertThat(responses).hasSize(2);
        verify(fileMetadataRepository).findByReference(TENANT_ID, REFERENCE_TYPE, REFERENCE_ID);
    }

    // ========== download tests ==========

    @Test
    @DisplayName("download: existing file - increments download count and returns resource")
    void download_existingFile_incrementsCount() {
        // given
        UUID fileId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "report.pdf",
                "application/pdf", 5000L, UPLOADER_ID);
        int initialCount = metadata.getDownloadCount();
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        when(storageService.retrieve(metadata.getStoragePath(), metadata.getStorageType()))
                .thenReturn(new ByteArrayInputStream(new byte[0]));
        when(fileMetadataRepository.save(metadata)).thenReturn(metadata);

        // when
        Resource resource = fileService.download(fileId);

        // then
        assertThat(resource).isNotNull();
        assertThat(metadata.getDownloadCount()).isEqualTo(initialCount + 1);
        verify(fileMetadataRepository).save(metadata);
    }

    @Test
    @DisplayName("download: storage retrieval fails - throws NotFoundException")
    void download_storageFails_throwsNotFoundException() {
        // given
        UUID fileId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "report.pdf",
                "application/pdf", 5000L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        when(storageService.retrieve(metadata.getStoragePath(), metadata.getStorageType()))
                .thenThrow(new RuntimeException("Storage unavailable"));

        // when & then
        assertThatThrownBy(() -> fileService.download(fileId))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("파일을 찾을 수 없습니다");
    }

    // ========== getPresignedUrl tests ==========

    @Test
    @DisplayName("getPresignedUrl: existing file - returns presigned URL")
    void getPresignedUrl_existingFile_returnsUrl() {
        // given
        UUID fileId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "report.pdf",
                "application/pdf", 5000L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        String expectedUrl = "https://bucket.s3.amazonaws.com/path/to/file?signed=true";
        when(storageService.generatePresignedUrl(metadata.getStoragePath(), metadata.getStorageType(), 30))
                .thenReturn(expectedUrl);

        // when
        String url = fileService.getPresignedUrl(fileId, 30);

        // then
        assertThat(url).isEqualTo(expectedUrl);
        verify(storageService).generatePresignedUrl(metadata.getStoragePath(), metadata.getStorageType(), 30);
    }

    // ========== delete tests ==========

    @Test
    @DisplayName("delete: own file - successfully deletes")
    void delete_ownFile_success() {
        // given
        UUID fileId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "my-file.pdf",
                "application/pdf", 1024L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        when(storageService.delete(metadata.getStoragePath(), metadata.getStorageType())).thenReturn(true);

        // when
        fileService.delete(fileId, UPLOADER_ID);

        // then
        verify(storageService).delete(metadata.getStoragePath(), metadata.getStorageType());
        verify(fileMetadataRepository).delete(metadata);
    }

    @Test
    @DisplayName("delete: other user's file - throws ForbiddenException")
    void delete_otherUserFile_throwsForbiddenException() {
        // given
        UUID fileId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "not-my-file.pdf",
                "application/pdf", 1024L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));

        // when & then
        assertThatThrownBy(() -> fileService.delete(fileId, otherUserId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("본인이 업로드한 파일만 삭제할 수 있습니다");

        verify(fileMetadataRepository, never()).delete(any(FileMetadata.class));
    }

    @Test
    @DisplayName("delete: admin override - successfully deletes other user's file")
    void delete_adminOverride_success() {
        // given
        UUID fileId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        FileMetadata metadata = createFileMetadata(fileId, "any-file.pdf",
                "application/pdf", 1024L, UPLOADER_ID);
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.of(metadata));
        when(storageService.delete(metadata.getStoragePath(), metadata.getStorageType())).thenReturn(true);

        // when
        fileService.delete(fileId, adminId, true);

        // then
        verify(storageService).delete(metadata.getStoragePath(), metadata.getStorageType());
        verify(fileMetadataRepository).delete(metadata);
    }

    @Test
    @DisplayName("delete: non-existent file - throws NotFoundException")
    void delete_nonExistent_throwsNotFoundException() {
        // given
        UUID fileId = UUID.randomUUID();
        when(fileMetadataRepository.findById(fileId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> fileService.delete(fileId, UPLOADER_ID))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("파일을 찾을 수 없습니다");
    }

    // ========== Helper methods ==========

    private MultipartFile mockMultipartFile(String filename, String contentType, long size) throws Exception {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn(filename);
        when(file.getContentType()).thenReturn(contentType);
        when(file.getSize()).thenReturn(size);
        when(file.isEmpty()).thenReturn(false);
        when(file.getBytes()).thenReturn(new byte[(int) size]);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[(int) size]));
        return file;
    }

    private FileMetadata createFileMetadata(UUID id, String originalName, String contentType,
                                            long fileSize, UUID uploaderId) {
        FileMetadata metadata = FileMetadata.builder()
                .originalName(originalName)
                .storedName(UUID.randomUUID() + getExtension(originalName))
                .contentType(contentType)
                .fileSize(fileSize)
                .storagePath("tenant/" + TENANT_ID + "/2026/02/10/" + originalName)
                .bucketName("test-bucket")
                .storageType(StorageType.LOCAL)
                .referenceType(REFERENCE_TYPE)
                .referenceId(REFERENCE_ID)
                .uploaderId(uploaderId)
                .uploaderName(UPLOADER_NAME)
                .isPublic(false)
                .downloadCount(0)
                .checksum("abc123")
                .build();
        setEntityId(metadata, id);
        return metadata;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    private void setEntityId(Object entity, UUID id) {
        Field field = findField(entity.getClass(), "id");
        if (field != null) {
            field.setAccessible(true);
            try {
                field.set(entity, id);
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Failed to set entity id", e);
            }
        }
    }

    private Field findField(Class<?> clazz, String name) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }

    private void setFieldValue(Object obj, String fieldName, Object value) {
        try {
            Field field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(obj, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }
}
