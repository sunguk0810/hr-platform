package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * 코드 그룹 수정 이벤트
 */
@Getter
@SuperBuilder
public class CodeGroupUpdatedEvent extends DomainEvent {

    private final UUID codeGroupId;
    private final String groupCode;
    private final String groupName;

    public static CodeGroupUpdatedEvent of(CodeGroup codeGroup) {
        return CodeGroupUpdatedEvent.builder()
            .codeGroupId(codeGroup.getId())
            .groupCode(codeGroup.getGroupCode())
            .groupName(codeGroup.getGroupName())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.CODE_GROUP_UPDATED;
    }
}
