package com.hrsaas.notification.service.impl;

import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.dto.request.UpdateNotificationSettingsRequest;
import com.hrsaas.notification.domain.dto.response.NotificationResponse;
import com.hrsaas.notification.domain.dto.response.NotificationSettingsResponse;
import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationPreference;
import com.hrsaas.notification.domain.entity.NotificationType;
import com.hrsaas.notification.repository.NotificationPreferenceRepository;
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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
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

    @Override
    public NotificationResponse getById(UUID notificationId, UUID recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NotFoundException("NTF_001", "알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getRecipientId().equals(recipientId)) {
            throw new ForbiddenException("NTF_002", "본인의 알림만 조회할 수 있습니다");
        }

        return NotificationResponse.from(notification);
    }

    @Override
    @Transactional
    public void delete(UUID notificationId, UUID recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new NotFoundException("NTF_001", "알림을 찾을 수 없습니다: " + notificationId));

        if (!notification.getRecipientId().equals(recipientId)) {
            throw new ForbiddenException("NTF_002", "본인의 알림만 삭제할 수 있습니다");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted: id={}", notificationId);
    }

    @Override
    @Transactional
    public int bulkDelete(List<UUID> notificationIds, UUID recipientId) {
        int deleted = 0;
        for (UUID id : notificationIds) {
            try {
                Notification notification = notificationRepository.findById(id).orElse(null);
                if (notification != null && notification.getRecipientId().equals(recipientId)) {
                    notificationRepository.delete(notification);
                    deleted++;
                }
            } catch (Exception e) {
                log.warn("Failed to delete notification: id={}", id);
            }
        }
        log.info("Bulk delete completed: requested={}, deleted={}", notificationIds.size(), deleted);
        return deleted;
    }

    @Override
    public NotificationSettingsResponse getSettings(UUID userId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<NotificationPreference> prefs = preferenceRepository.findByTenantIdAndUserId(tenantId, userId);

        // Build a map of (type+channel) -> enabled for quick lookup
        Map<String, Boolean> prefMap = prefs.stream()
            .collect(Collectors.toMap(
                p -> p.getNotificationType().name() + "_" + p.getChannel().name(),
                NotificationPreference::getEnabled,
                (a, b) -> b
            ));

        return NotificationSettingsResponse.builder()
            .emailEnabled(prefMap.getOrDefault("SYSTEM_EMAIL", true))
            .pushEnabled(prefMap.getOrDefault("SYSTEM_WEB_PUSH", true))
            .browserEnabled(true)
            .smsEnabled(prefMap.getOrDefault("SYSTEM_SMS", false))
            .approvalNotifications(prefMap.getOrDefault("APPROVAL_REQUESTED_WEB_PUSH", true))
            .leaveNotifications(prefMap.getOrDefault("LEAVE_REQUESTED_WEB_PUSH", true))
            .announcementNotifications(prefMap.getOrDefault("ANNOUNCEMENT_WEB_PUSH", true))
            .reminderNotifications(true)
            .systemNotifications(prefMap.getOrDefault("SYSTEM_WEB_PUSH", true))
            .digestEnabled(false)
            .quietHoursEnabled(false)
            .build();
    }

    @Override
    @Transactional
    public NotificationSettingsResponse updateSettings(UUID userId, UpdateNotificationSettingsRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // Update channel preferences
        if (request.getApprovalNotifications() != null) {
            upsertPreference(tenantId, userId, NotificationType.APPROVAL_REQUESTED, NotificationChannel.WEB_PUSH, request.getApprovalNotifications());
            upsertPreference(tenantId, userId, NotificationType.APPROVAL_APPROVED, NotificationChannel.WEB_PUSH, request.getApprovalNotifications());
            upsertPreference(tenantId, userId, NotificationType.APPROVAL_REJECTED, NotificationChannel.WEB_PUSH, request.getApprovalNotifications());
        }
        if (request.getLeaveNotifications() != null) {
            upsertPreference(tenantId, userId, NotificationType.LEAVE_REQUESTED, NotificationChannel.WEB_PUSH, request.getLeaveNotifications());
        }
        if (request.getAnnouncementNotifications() != null) {
            upsertPreference(tenantId, userId, NotificationType.ANNOUNCEMENT, NotificationChannel.WEB_PUSH, request.getAnnouncementNotifications());
        }
        if (request.getEmailEnabled() != null) {
            upsertPreference(tenantId, userId, NotificationType.SYSTEM, NotificationChannel.EMAIL, request.getEmailEnabled());
        }
        if (request.getSmsEnabled() != null) {
            upsertPreference(tenantId, userId, NotificationType.SYSTEM, NotificationChannel.SMS, request.getSmsEnabled());
        }

        log.info("Notification settings updated: userId={}", userId);
        return getSettings(userId);
    }

    private void upsertPreference(UUID tenantId, UUID userId, NotificationType type, NotificationChannel channel, boolean enabled) {
        List<NotificationPreference> prefs = preferenceRepository.findByTenantIdAndUserId(tenantId, userId);
        NotificationPreference existing = prefs.stream()
            .filter(p -> p.getNotificationType() == type && p.getChannel() == channel)
            .findFirst()
            .orElse(null);

        if (existing != null) {
            existing.setEnabled(enabled);
            preferenceRepository.save(existing);
        } else {
            NotificationPreference pref = NotificationPreference.builder()
                .userId(userId)
                .notificationType(type)
                .channel(channel)
                .enabled(enabled)
                .build();
            preferenceRepository.save(pref);
        }
    }
}
