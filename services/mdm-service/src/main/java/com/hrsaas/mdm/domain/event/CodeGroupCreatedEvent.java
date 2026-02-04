package com.hrsaas.mdm.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.mdm.domain.entity.CodeGroup;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class CodeGroupCreatedEvent extends DomainEvent {

    private final UUID codeGroupId;
    private final String groupCode;
    private final String groupName;
    private final String description;

    public static CodeGroupCreatedEvent of(CodeGroup codeGroup) {
        return CodeGroupCreatedEvent.builder()
            .codeGroupId(codeGroup.getId())
            .groupCode(codeGroup.getGroupCode())
            .groupName(codeGroup.getGroupName())
            .description(codeGroup.getDescription())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.CODE_GROUP_CREATED;
    }
}
