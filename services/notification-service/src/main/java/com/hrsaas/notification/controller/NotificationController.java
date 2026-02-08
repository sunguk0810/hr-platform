package com.hrsaas.notification.controller;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.request.UpdateNotificationSettingsRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.domain.dto.response.NotificationSettingsResponse;
import com.hrsaas.notification.service.NotificationService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "알림 관리 API")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "알림 발송")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<NotificationResponse>> send(@Valid @RequestBody SendNotificationRequest request) {
        return ApiResponse.success(notificationService.send(request));
    }

    @GetMapping("/my")
    @Operation(summary = "내 알림 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<NotificationResponse>> getMyNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.getMyNotifications(userId, pageable));
    }

    @GetMapping("/my/unread")
    @Operation(summary = "읽지 않은 알림 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<NotificationResponse>> getUnreadNotifications() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/my/unread/count")
    @Operation(summary = "읽지 않은 알림 수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> countUnread() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "알림 읽음 처리")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> markAsRead(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        notificationService.markAsRead(id, userId);
        return ApiResponse.success(null);
    }

    @PostMapping("/my/read-all")
    @Operation(summary = "모든 알림 읽음 처리")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> markAllAsRead() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        notificationService.markAllAsRead(userId);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}")
    @Operation(summary = "알림 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationResponse> getById(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.getById(id, userId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "알림 삭제")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        notificationService.delete(id, userId);
        return ApiResponse.success(null, "알림이 삭제되었습니다.");
    }

    @PostMapping("/bulk-delete")
    @Operation(summary = "알림 일괄 삭제")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Integer>> bulkDelete(
            @RequestBody Map<String, List<String>> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        List<UUID> ids = body.get("ids").stream().map(UUID::fromString).toList();
        int deleted = notificationService.bulkDelete(ids, userId);
        return ApiResponse.success(Map.of("deleted", deleted));
    }

    @GetMapping("/settings")
    @Operation(summary = "알림 설정 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationSettingsResponse> getSettings() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.getSettings(userId));
    }

    @PutMapping("/settings")
    @Operation(summary = "알림 설정 수정")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationSettingsResponse> updateSettings(
            @RequestBody UpdateNotificationSettingsRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(notificationService.updateSettings(userId, request));
    }
}
