package com.hrsaas.notification.controller;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.service.NotificationService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<NotificationResponse>> send(@Valid @RequestBody SendNotificationRequest request) {
        return ApiResponse.success(notificationService.send(request));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<NotificationResponse>> getMyNotifications(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(notificationService.getMyNotifications(userId, pageable));
    }

    @GetMapping("/my/unread")
    public ApiResponse<List<NotificationResponse>> getUnreadNotifications(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(notificationService.getUnreadNotifications(userId));
    }

    @GetMapping("/my/unread/count")
    public ApiResponse<Long> countUnread(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        notificationService.markAsRead(id, userId);
        return ApiResponse.success(null);
    }

    @PostMapping("/my/read-all")
    public ApiResponse<Void> markAllAsRead(@RequestHeader("X-User-ID") UUID userId) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.success(null);
    }
}
