package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TenantFeatureChangedEvent extends DomainEvent {

    private final UUID tenantId;
    private final String featureCode;
    private final Boolean isEnabled;

    @Override
    public String getTopic() {
        return EventTopics.TENANT_FEATURE_CHANGED;
    }
}
