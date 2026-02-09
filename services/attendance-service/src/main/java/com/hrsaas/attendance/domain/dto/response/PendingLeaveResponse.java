package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.LeaveRequest;
import com.hrsaas.attendance.domain.entity.LeaveStatus;
import com.hrsaas.attendance.domain.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingLeaveResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID departmentId;
    private String departmentName;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal daysCount;
    private String reason;
    private LeaveStatus status;
    private BigDecimal remainingDays;
    private boolean urgent;
    private Instant createdAt;

    public static PendingLeaveResponse from(LeaveRequest request, BigDecimal remainingDays, boolean urgent) {
        return PendingLeaveResponse.builder()
            .id(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .leaveType(request.getLeaveType())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .daysCount(request.getDaysCount())
            .reason(request.getReason())
            .status(request.getStatus())
            .remainingDays(remainingDays)
            .urgent(urgent)
            .createdAt(request.getCreatedAt())
            .build();
    }
}
