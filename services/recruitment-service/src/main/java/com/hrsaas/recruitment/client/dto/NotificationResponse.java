package com.hrsaas.recruitment.client.dto;

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
}
