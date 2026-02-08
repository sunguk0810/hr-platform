package com.hrsaas.file.controller;

import com.hrsaas.file.domain.dto.response.FileResponse;
import com.hrsaas.file.service.FileService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "File", description = "파일 관리 API")
public class FileController {

    private final FileService fileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "파일 업로드")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) UUID referenceId,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(fileService.upload(file, referenceType, referenceId,
                currentUser.getUserId(), currentUser.getEmployeeName(), isPublic));
    }

    @PostMapping(value = "/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "다중 파일 업로드")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<FileResponse>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "referenceType", required = false) String referenceType,
            @RequestParam(value = "referenceId", required = false) UUID referenceId,
            @RequestParam(value = "isPublic", required = false) Boolean isPublic) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(fileService.uploadMultiple(files, referenceType, referenceId,
                currentUser.getUserId(), currentUser.getEmployeeName(), isPublic));
    }

    @GetMapping("/{id}")
    @Operation(summary = "파일 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<FileResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(fileService.getById(id));
    }

    @GetMapping("/reference/{referenceType}/{referenceId}")
    @Operation(summary = "참조별 파일 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<FileResponse>> getByReference(
            @PathVariable String referenceType,
            @PathVariable UUID referenceId) {
        return ApiResponse.success(fileService.getByReference(referenceType, referenceId));
    }

    @GetMapping("/my")
    @Operation(summary = "내 파일 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<FileResponse>> getMyFiles(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(fileService.getMyFiles(userId, pageable));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "파일 다운로드")
    @PreAuthorize("isAuthenticated()")
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
    @Operation(summary = "사전 서명된 URL 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> getPresignedUrl(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "60") int expirationMinutes) {
        return ApiResponse.success(fileService.getPresignedUrl(id, expirationMinutes));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "파일 삭제")
    @PreAuthorize("isAuthenticated()")
    public void delete(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        fileService.delete(id, userId);
    }
}
