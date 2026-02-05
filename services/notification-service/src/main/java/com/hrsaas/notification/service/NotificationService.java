package com.hrsaas.notification.service;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.request.UpdateNotificationSettingsRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.domain.dto.response.NotificationSettingsResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    List<NotificationResponse> send(SendNotificationRequest request);

    NotificationResponse getById(UUID notificationId, UUID recipientId);

    PageResponse<NotificationResponse> getMyNotifications(UUID recipientId, Pageable pageable);

    List<NotificationResponse> getUnreadNotifications(UUID recipientId);

    long countUnread(UUID recipientId);

    void markAsRead(UUID notificationId, UUID recipientId);

    void markAllAsRead(UUID recipientId);

    void delete(UUID notificationId, UUID recipientId);

    int bulkDelete(List<UUID> notificationIds, UUID recipientId);

    NotificationSettingsResponse getSettings(UUID userId);

    NotificationSettingsResponse updateSettings(UUID userId, UpdateNotificationSettingsRequest request);
}
