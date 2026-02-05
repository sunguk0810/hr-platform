package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.CondolenceEventType;
import com.hrsaas.employee.domain.entity.CondolenceRequest;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
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
public class CondolenceRequestResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String departmentName;
    private UUID policyId;
    private CondolenceEventType eventType;
    private LocalDate eventDate;
    private String description;
    private String relation;
    private String relatedPersonName;
    private BigDecimal amount;
    private Integer leaveDays;
    private CondolenceStatus status;
    private UUID approvalId;
    private LocalDate paidDate;
    private String rejectReason;
    private Instant createdAt;
    private Instant updatedAt;

    public static CondolenceRequestResponse from(CondolenceRequest request) {
        return CondolenceRequestResponse.builder()
            .id(request.getId())
            .employeeId(request.getEmployeeId())
            .employeeName(request.getEmployeeName())
            .departmentName(request.getDepartmentName())
            .policyId(request.getPolicyId())
            .eventType(request.getEventType())
            .eventDate(request.getEventDate())
            .description(request.getDescription())
            .relation(request.getRelation())
            .relatedPersonName(request.getRelatedPersonName())
            .amount(request.getAmount())
            .leaveDays(request.getLeaveDays())
            .status(request.getStatus())
            .approvalId(request.getApprovalId())
            .paidDate(request.getPaidDate())
            .rejectReason(request.getRejectReason())
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .build();
    }
}
