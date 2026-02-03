package com.hrsaas.notification.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "notification_preference", schema = "hr_notification",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "user_id", "notification_type", "channel"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NotificationPreference extends TenantAwareEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    private NotificationChannel channel;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = true;
}
