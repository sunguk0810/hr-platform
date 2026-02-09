package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * 코드 유예기간 만료 이벤트
 */
@Getter
@SuperBuilder
public class CodeGracePeriodExpiredEvent extends DomainEvent {

    private final UUID codeId;
    private final String groupCode;
    private final String code;

    @Override
    public String getTopic() {
        return EventTopics.CODE_GRACE_PERIOD_EXPIRED;
    }
}
