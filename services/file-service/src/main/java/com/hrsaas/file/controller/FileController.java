package com.hrsaas.file.controller;

import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.file.service.FileService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) UUID referenceId,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        return ApiResponse.success(fileService.upload(file, referenceType, referenceId, userId, userName, isPublic));
    }

    @PostMapping(value = "/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<FileResponse>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) UUID referenceId,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName) {
        return ApiResponse.success(fileService.uploadMultiple(files, referenceType, referenceId, userId, userName, isPublic));
    }

    @GetMapping("/{id}")
    public ApiResponse<FileResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(fileService.getById(id));
    }

    @GetMapping("/reference/{referenceType}/{referenceId}")
    public ApiResponse<List<FileResponse>> getByReference(
            @PathVariable String referenceType,
            @PathVariable UUID referenceId) {
        return ApiResponse.success(fileService.getByReference(referenceType, referenceId));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<FileResponse>> getMyFiles(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(fileService.getMyFiles(userId, pageable));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        Resource resource = fileService.download(id);
        FileResponse fileInfo = fileService.getById(id);

        String encodedFileName = URLEncoder.encode(fileInfo.getOriginalName(), StandardCharsets.UTF_8)
            .replace("+", "%20");

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(fileInfo.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename*=UTF-8''" + encodedFileName)
            .body(resource);
    }

    @GetMapping("/{id}/presigned-url")
    public ApiResponse<String> getPresignedUrl(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "60") int expirationMinutes) {
        return ApiResponse.success(fileService.getPresignedUrl(id, expirationMinutes));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        fileService.delete(id, userId);
    }
}
