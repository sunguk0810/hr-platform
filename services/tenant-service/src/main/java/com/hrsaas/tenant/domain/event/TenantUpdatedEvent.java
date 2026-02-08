package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.tenant.domain.entity.Tenant;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TenantUpdatedEvent extends DomainEvent {

    private final UUID tenantId;
    private final String tenantCode;

    public static TenantUpdatedEvent of(Tenant tenant) {
        return TenantUpdatedEvent.builder()
            .tenantId(tenant.getId())
            .tenantCode(tenant.getCode())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.TENANT_UPDATED;
    }
}
