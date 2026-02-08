package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TenantStatusChangedEvent extends DomainEvent {

    private final UUID tenantId;
    private final String tenantCode;
    private final TenantStatus previousStatus;
    private final TenantStatus newStatus;

    @Override
    public String getTopic() {
        return EventTopics.TENANT_STATUS_CHANGED;
    }
}
