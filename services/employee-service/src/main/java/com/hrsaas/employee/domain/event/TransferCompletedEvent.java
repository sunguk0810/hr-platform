package com.hrsaas.employee.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class TransferCompletedEvent extends DomainEvent {

    private final UUID transferRequestId;
    private final UUID sourceEmployeeId;
    private final UUID targetEmployeeId;
    private final UUID sourceTenantId;
    private final UUID targetTenantId;

    @Override
    public String getTopic() {
        return EventTopics.EMPLOYEE_TRANSFER_COMPLETED;
    }
}
