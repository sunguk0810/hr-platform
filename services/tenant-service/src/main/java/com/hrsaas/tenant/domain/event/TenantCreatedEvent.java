package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.tenant.domain.entity.Tenant;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TenantCreatedEvent extends DomainEvent {

    private final UUID tenantId;
    private final String tenantCode;
    private final String tenantName;

    public static TenantCreatedEvent of(Tenant tenant) {
        return TenantCreatedEvent.builder()
            .tenantId(tenant.getId())
            .tenantCode(tenant.getCode())
            .tenantName(tenant.getName())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.TENANT_CREATED;
    }
}
