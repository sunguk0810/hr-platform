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
public class LeaveRequestResponse {

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
    private UUID approvalDocumentId;
    private String emergencyContact;
    private UUID handoverToId;
    private String handoverToName;
    private String handoverNotes;
    private Instant createdAt;
    private Instant updatedAt;

    public static LeaveRequestResponse from(LeaveRequest request) {
        return LeaveRequestResponse.builder()
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
            .approvalDocumentId(request.getApprovalDocumentId())
            .emergencyContact(request.getEmergencyContact())
            .handoverToId(request.getHandoverToId())
            .handoverToName(request.getHandoverToName())
            .handoverNotes(request.getHandoverNotes())
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .build();
    }
}
