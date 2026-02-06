package com.hrsaas.employee.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * Domain event published when an employee's affiliation is added, removed, or updated.
 */
@Getter
@SuperBuilder
public class EmployeeAffiliationChangedEvent extends DomainEvent {

    private final UUID employeeId;
    private final UUID departmentId;
    private final String affiliationType;
    private final String action; // ADDED, REMOVED, UPDATED

    @Override
    public String getTopic() {
        return EventTopics.EMPLOYEE_AFFILIATION_CHANGED;
    }
}
