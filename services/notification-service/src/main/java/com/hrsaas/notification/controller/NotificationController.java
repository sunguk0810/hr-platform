package com.hrsaas.notification.controller;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.service.NotificationService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
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
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(notificationService.getMyNotifications(userId, pageable));
    }

    @GetMapping("/my/unread")
    @Operation(summary = "읽지 않은 알림 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<NotificationResponse>> getUnreadNotifications(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/my/unread/count")
    @Operation(summary = "읽지 않은 알림 수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> countUnread(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "알림 읽음 처리")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        notificationService.markAsRead(id, userId);
        return ApiResponse.success(null);
    }

    @PostMapping("/my/read-all")
    @Operation(summary = "모든 알림 읽음 처리")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> markAllAsRead(@RequestHeader("X-User-ID") UUID userId) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.success(null);
    }
}
