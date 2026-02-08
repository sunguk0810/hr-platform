package com.hrsaas.tenant.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@SuperBuilder
public class ContractExpiryWarningEvent extends DomainEvent {

    private final UUID tenantId;
    private final String tenantCode;
    private final LocalDate contractEndDate;
    private final int daysUntilExpiry;

    @Override
    public String getTopic() {
        return EventTopics.TENANT_CONTRACT_EXPIRY;
    }
}
