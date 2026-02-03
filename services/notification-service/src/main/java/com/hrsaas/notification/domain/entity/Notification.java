package com.hrsaas.notification.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification", schema = "hr_notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Notification extends TenantAwareEntity {

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(name = "recipient_email")
    private String recipientEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private NotificationChannel channel;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "link_url")
    private String linkUrl;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "is_sent", nullable = false)
    @Builder.Default
    private Boolean isSent = false;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "send_error")
    private String sendError;

    public void markAsRead() {
        this.isRead = true;
        this.readAt = Instant.now();
    }

    public void markAsSent() {
        this.isSent = true;
        this.sentAt = Instant.now();
    }

    public void markAsFailed(String error) {
        this.isSent = false;
        this.sendError = error;
    }
}
