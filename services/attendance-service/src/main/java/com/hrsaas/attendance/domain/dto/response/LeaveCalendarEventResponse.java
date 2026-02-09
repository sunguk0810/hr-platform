package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
import com.hrsaas.attendance.domain.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveCalendarEventResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String departmentName;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal days;
    private LeaveStatus status;

    public static LeaveCalendarEventResponse from(LeaveRequest request) {
        return LeaveCalendarEventResponse.builder()
            .id(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentName(request.getDepartmentName())
            .leaveType(request.getLeaveType())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .days(request.getDaysCount())
            .status(request.getStatus())
            .build();
    }
}
