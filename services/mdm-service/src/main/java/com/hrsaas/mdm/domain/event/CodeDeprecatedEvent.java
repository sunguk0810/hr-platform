package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * 코드 폐기 이벤트
 */
@Getter
@SuperBuilder
public class CodeDeprecatedEvent extends DomainEvent {

    private final UUID codeId;
    private final String groupCode;
    private final String code;
    private final UUID replacementCodeId;
    private final Integer gracePeriodDays;
    private final Instant deprecatedAt;

    @Override
    public String getTopic() {
        return EventTopics.CODE_DEPRECATED;
    }
}
