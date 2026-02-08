package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.tenant.domain.entity.PolicyType;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TenantPolicyChangedEvent extends DomainEvent {

    private final UUID tenantId;
    private final PolicyType policyType;
    private final String action; // CREATED, UPDATED, DELETED

    @Override
    public String getTopic() {
        return EventTopics.TENANT_POLICY_CHANGED;
    }
}
