package com.hrsaas.organization.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.organization.domain.dto.request.CreateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.request.UpdateAnnouncementRequest;
import com.hrsaas.organization.domain.dto.response.AnnouncementResponse;
import com.hrsaas.organization.domain.entity.AnnouncementCategory;
import com.hrsaas.organization.service.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcement", description = "공지사항 관리 API")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    @Operation(summary = "공지사항 생성")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> create(
            @Valid @RequestBody CreateAnnouncementRequest request) {
        AnnouncementResponse response = announcementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "공지사항 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> getById(@PathVariable UUID id) {
        AnnouncementResponse response = announcementService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "공지사항 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<AnnouncementResponse>>> getAll(
            @RequestParam(required = false) AnnouncementCategory category,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AnnouncementResponse> response = announcementService.search(category, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/published")
    @Operation(summary = "발행된 공지사항 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<AnnouncementResponse>>> getPublished(
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AnnouncementResponse> response = announcementService.getPublished(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pinned")
    @Operation(summary = "고정 공지사항 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getPinned() {
        List<AnnouncementResponse> response = announcementService.getPinned();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "공지사항 수정")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAnnouncementRequest request) {
        AnnouncementResponse response = announcementService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "공지사항 삭제")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        announcementService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공지사항이 삭제되었습니다."));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "공지사항 발행")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> publish(@PathVariable UUID id) {
        announcementService.publish(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공지사항이 발행되었습니다."));
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "공지사항 발행 취소")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unpublish(@PathVariable UUID id) {
        announcementService.unpublish(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공지사항 발행이 취소되었습니다."));
    }
}
