package com.hrsaas.employee.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.employee.domain.entity.Employee;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class EmployeeCreatedEvent extends DomainEvent {

    private final UUID employeeId;
    private final String employeeNumber;
    private final String name;
    private final String email;
    private final UUID departmentId;

    public static EmployeeCreatedEvent of(Employee employee) {
        return EmployeeCreatedEvent.builder()
            .employeeId(employee.getId())
            .employeeNumber(employee.getEmployeeNumber())
            .name(employee.getName())
            .email(employee.getEmail())
            .departmentId(employee.getDepartmentId())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.EMPLOYEE_CREATED;
    }
}
