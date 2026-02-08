package com.hrsaas.organization.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.UUID;

@Getter
@SuperBuilder
public class DepartmentMergedEvent extends DomainEvent {

    private final List<UUID> sourceIds;
    private final UUID targetId;
    private final String targetName;
    private final String reason;

    @Override
    public String getTopic() {
        return EventTopics.DEPARTMENT_MERGED;
    }
}
