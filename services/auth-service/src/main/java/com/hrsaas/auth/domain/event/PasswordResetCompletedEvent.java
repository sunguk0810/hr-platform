package com.hrsaas.auth.domain.event;

import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class PasswordResetCompletedEvent extends DomainEvent {

    private final UUID userId;
    private final String username;
    private final String email;
    private final String tempPassword;

    public static PasswordResetCompletedEvent of(UserEntity user, String tempPassword) {
        return PasswordResetCompletedEvent.builder()
                .tenantId(user.getTenantId())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .tempPassword(tempPassword)
                .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.NOTIFICATION_SEND;
    }
}
