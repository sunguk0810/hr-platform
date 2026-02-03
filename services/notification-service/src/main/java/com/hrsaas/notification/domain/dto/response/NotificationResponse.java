package com.hrsaas.notification.domain.dto.response;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private UUID recipientId;
    private NotificationType notificationType;
    private NotificationChannel channel;
    private String title;
    private String content;
    private String linkUrl;
    private String referenceType;
    private UUID referenceId;
    private Boolean isRead;
    private Instant readAt;
    private Boolean isSent;
    private Instant sentAt;
    private Instant createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .recipientId(notification.getRecipientId())
            .notificationType(notification.getNotificationType())
            .channel(notification.getChannel())
            .title(notification.getTitle())
            .content(notification.getContent())
            .linkUrl(notification.getLinkUrl())
            .referenceType(notification.getReferenceType())
            .referenceId(notification.getReferenceId())
            .isRead(notification.getIsRead())
            .readAt(notification.getReadAt())
            .isSent(notification.getIsSent())
            .sentAt(notification.getSentAt())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}
