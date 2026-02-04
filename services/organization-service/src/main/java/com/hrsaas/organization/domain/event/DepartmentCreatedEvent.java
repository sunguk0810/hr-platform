package com.hrsaas.organization.domain.event;

import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import com.hrsaas.organization.domain.entity.Department;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class DepartmentCreatedEvent extends DomainEvent {

    private final UUID departmentId;
    private final String code;
    private final String name;
    private final UUID parentId;
    private final Integer level;

    public static DepartmentCreatedEvent of(Department department) {
        return DepartmentCreatedEvent.builder()
            .departmentId(department.getId())
            .code(department.getCode())
            .name(department.getName())
            .parentId(department.getParent() != null ? department.getParent().getId() : null)
            .level(department.getLevel())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.DEPARTMENT_CREATED;
    }
}
