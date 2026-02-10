package com.hrsaas.file.service;

import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface FileService {

    FileResponse upload(MultipartFile file, String referenceType, UUID referenceId,
                         UUID uploaderId, String uploaderName, Boolean isPublic);

    List<FileResponse> uploadMultiple(List<MultipartFile> files, String referenceType, UUID referenceId,
                                       UUID uploaderId, String uploaderName, Boolean isPublic);

    FileResponse getById(UUID id);

    List<FileResponse> getByReference(String referenceType, UUID referenceId);

    PageResponse<FileResponse> getMyFiles(UUID uploaderId, Pageable pageable);

    Resource download(UUID id);

    String getPresignedUrl(UUID id, int expirationMinutes);

    void delete(UUID id, UUID requesterId);

    void delete(UUID id, UUID requesterId, boolean isAdmin);
}
