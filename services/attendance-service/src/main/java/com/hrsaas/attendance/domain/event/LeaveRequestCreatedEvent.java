package com.hrsaas.attendance.domain.event;

import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@SuperBuilder
public class LeaveRequestCreatedEvent extends DomainEvent {

    private final UUID leaveRequestId;
    private final UUID employeeId;
    private final String employeeName;
    private final UUID departmentId;
    private final String departmentName;
    private final LeaveType leaveType;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final BigDecimal daysCount;
    private final String reason;

    public static LeaveRequestCreatedEvent of(LeaveRequest request) {
        return LeaveRequestCreatedEvent.builder()
            .leaveRequestId(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .leaveType(request.getLeaveType())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .daysCount(request.getDaysCount())
            .reason(request.getReason())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.LEAVE_REQUESTED;
    }
}
