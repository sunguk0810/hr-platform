package com.hrsaas.attendance.domain.dto.response;

import com.hrsaas.attendance.domain.entity.OvertimeRequest;
import com.hrsaas.attendance.domain.entity.OvertimeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OvertimeRequestResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID departmentId;
    private String departmentName;
    private LocalDate overtimeDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal plannedHours;
    private BigDecimal actualHours;
    private OvertimeStatus status;
    private String reason;
    private String rejectionReason;
    private UUID approvalDocumentId;
    private Instant createdAt;
    private Instant updatedAt;

    public static OvertimeRequestResponse from(OvertimeRequest request) {
        return OvertimeRequestResponse.builder()
            .id(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .overtimeDate(request.getOvertimeDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .plannedHours(request.getPlannedHours())
            .actualHours(request.getActualHours())
            .status(request.getStatus())
            .reason(request.getReason())
            .rejectionReason(request.getRejectionReason())
            .approvalDocumentId(request.getApprovalDocumentId())
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .build();
    }
}
