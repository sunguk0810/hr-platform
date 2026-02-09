package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * 코드 유예기간 만료 임박 이벤트 (7일 전 알림)
 */
@Getter
@SuperBuilder
public class CodeGracePeriodExpiringEvent extends DomainEvent {

    private final UUID codeId;
    private final String groupCode;
    private final String code;
    private final Instant expiresAt;
    private final int daysRemaining;

    @Override
    public String getTopic() {
        return EventTopics.CODE_GRACE_PERIOD_EXPIRING;
    }
}
