package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.TransferRequest;
import com.hrsaas.employee.domain.entity.TransferStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferRequestResponse {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String employeeNumber;

    // Source (전출)
    private UUID sourceTenantId;
    private String sourceTenantName;
    private UUID sourceDepartmentId;
    private String sourceDepartmentName;
    private UUID sourcePositionId;
    private String sourcePositionName;
    private UUID sourceGradeId;
    private String sourceGradeName;

    // Target (전입)
    private UUID targetTenantId;
    private String targetTenantName;
    private UUID targetDepartmentId;
    private String targetDepartmentName;
    private UUID targetPositionId;
    private String targetPositionName;
    private UUID targetGradeId;
    private String targetGradeName;

    private LocalDate transferDate;
    private String reason;
    private TransferStatus status;

    // Approval info
    private UUID sourceApproverId;
    private String sourceApproverName;
    private LocalDateTime sourceApprovedAt;
    private UUID targetApproverId;
    private String targetApproverName;
    private LocalDateTime targetApprovedAt;
    private String rejectReason;
    private LocalDateTime completedAt;

    private Instant createdAt;
    private Instant updatedAt;

    public static TransferRequestResponse from(TransferRequest entity) {
        return TransferRequestResponse.builder()
            .id(entity.getId())
            .employeeId(entity.getEmployeeId())
            .employeeName(entity.getEmployeeName())
            .employeeNumber(entity.getEmployeeNumber())
            .sourceTenantId(entity.getSourceTenantId())
            .sourceTenantName(entity.getSourceTenantName())
            .sourceDepartmentId(entity.getSourceDepartmentId())
            .sourceDepartmentName(entity.getSourceDepartmentName())
            .sourcePositionId(entity.getSourcePositionId())
            .sourcePositionName(entity.getSourcePositionName())
            .sourceGradeId(entity.getSourceGradeId())
            .sourceGradeName(entity.getSourceGradeName())
            .targetTenantId(entity.getTargetTenantId())
            .targetTenantName(entity.getTargetTenantName())
            .targetDepartmentId(entity.getTargetDepartmentId())
            .targetDepartmentName(entity.getTargetDepartmentName())
            .targetPositionId(entity.getTargetPositionId())
            .targetPositionName(entity.getTargetPositionName())
            .targetGradeId(entity.getTargetGradeId())
            .targetGradeName(entity.getTargetGradeName())
            .transferDate(entity.getTransferDate())
            .reason(entity.getReason())
            .status(entity.getStatus())
            .sourceApproverId(entity.getSourceApproverId())
            .sourceApproverName(entity.getSourceApproverName())
            .sourceApprovedAt(entity.getSourceApprovedAt())
            .targetApproverId(entity.getTargetApproverId())
            .targetApproverName(entity.getTargetApproverName())
            .targetApprovedAt(entity.getTargetApprovedAt())
            .rejectReason(entity.getRejectReason())
            .completedAt(entity.getCompletedAt())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
}
