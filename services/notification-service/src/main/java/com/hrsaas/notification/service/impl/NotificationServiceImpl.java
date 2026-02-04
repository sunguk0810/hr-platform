package com.hrsaas.notification.service.impl;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.repository.NotificationRepository;
import com.hrsaas.notification.sender.NotificationDispatcher;
import com.hrsaas.notification.service.NotificationService;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationDispatcher notificationDispatcher;

    @Override
    @Transactional
    public List<NotificationResponse> send(SendNotificationRequest request) {
        List<NotificationChannel> channels = request.getChannels();
        if (channels == null || channels.isEmpty()) {
            channels = List.of(NotificationChannel.WEB_PUSH);
        }

        List<Notification> notifications = new ArrayList<>();

        for (NotificationChannel channel : channels) {
            Notification notification = Notification.builder()
                .recipientId(request.getRecipientId())
                .recipientEmail(request.getRecipientEmail())
                .notificationType(request.getNotificationType())
                .channel(channel)
                .title(request.getTitle())
                .content(request.getContent())
                .linkUrl(request.getLinkUrl())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .build();

            notifications.add(notification);
        }

        List<Notification> saved = notificationRepository.saveAll(notifications);

        // 비동기로 실제 발송 처리
        notificationDispatcher.dispatchAll(saved);

        log.info("Notifications queued for sending: recipientId={}, type={}, channels={}",
            request.getRecipientId(), request.getNotificationType(), channels);

        return saved.stream()
            .map(NotificationResponse::from)
            .toList();
    }

    @Override
    public PageResponse<NotificationResponse> getMyNotifications(UUID recipientId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<Notification> page = notificationRepository.findByRecipientId(tenantId, recipientId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(NotificationResponse::from)
            .toList());
    }

    @Override
    public List<NotificationResponse> getUnreadNotifications(UUID recipientId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Notification> notifications = notificationRepository.findUnreadByRecipientId(tenantId, recipientId);
        return notifications.stream()
            .map(NotificationResponse::from)
            .toList();
    }

    @Override
    public long countUnread(UUID recipientId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return notificationRepository.countUnreadByRecipientId(tenantId, recipientId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId, UUID recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NotFoundException("NTF_001", "알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getRecipientId().equals(recipientId)) {
            throw new ForbiddenException("NTF_002", "본인의 알림만 읽음 처리할 수 있습니다");
        }

        notification.markAsRead();
        notificationRepository.save(notification);
        log.debug("Notification marked as read: id={}", notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID recipientId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        int updated = notificationRepository.markAllAsRead(tenantId, recipientId);
        log.info("All notifications marked as read: recipientId={}, count={}", recipientId, updated);
    }
}
