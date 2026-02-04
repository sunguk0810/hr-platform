package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.mdm.domain.entity.CommonCode;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class CommonCodeCreatedEvent extends DomainEvent {

    private final UUID codeId;
    private final String groupCode;
    private final String code;
    private final String codeName;

    public static CommonCodeCreatedEvent of(CommonCode commonCode) {
        return CommonCodeCreatedEvent.builder()
            .codeId(commonCode.getId())
            .groupCode(commonCode.getCodeGroup().getGroupCode())
            .code(commonCode.getCode())
            .codeName(commonCode.getCodeName())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.COMMON_CODE_CREATED;
    }
}
