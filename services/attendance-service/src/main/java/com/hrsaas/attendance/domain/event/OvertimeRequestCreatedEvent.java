package com.hrsaas.attendance.domain.event;

import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@SuperBuilder
public class OvertimeRequestCreatedEvent extends DomainEvent {

    private final UUID overtimeRequestId;
    private final UUID employeeId;
    private final String employeeName;
    private final UUID departmentId;
    private final LocalDate overtimeDate;
    private final BigDecimal plannedHours;
    private final String reason;

    public static OvertimeRequestCreatedEvent of(OvertimeRequest request) {
        return OvertimeRequestCreatedEvent.builder()
            .overtimeRequestId(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentId(request.getDepartmentId())
            .overtimeDate(request.getOvertimeDate())
            .plannedHours(request.getPlannedHours())
            .reason(request.getReason())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.OVERTIME_REQUESTED;
    }
}
