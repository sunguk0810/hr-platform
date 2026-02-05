package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 계열사 전출/전입 요청 엔티티
 */
@Entity
@Table(name = "transfer_request", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransferRequest extends TenantAwareEntity {

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "employee_number", length = 50)
    private String employeeNumber;

    // 전출 정보 (원 소속)
    @Column(name = "source_tenant_id", nullable = false)
    private UUID sourceTenantId;

    @Column(name = "source_tenant_name", length = 200)
    private String sourceTenantName;

    @Column(name = "source_department_id")
    private UUID sourceDepartmentId;

    @Column(name = "source_department_name", length = 200)
    private String sourceDepartmentName;

    @Column(name = "source_position_id")
    private UUID sourcePositionId;

    @Column(name = "source_position_name", length = 100)
    private String sourcePositionName;

    @Column(name = "source_grade_id")
    private UUID sourceGradeId;

    @Column(name = "source_grade_name", length = 100)
    private String sourceGradeName;

    // 전입 정보 (대상 소속)
    @Column(name = "target_tenant_id", nullable = false)
    private UUID targetTenantId;

    @Column(name = "target_tenant_name", length = 200)
    private String targetTenantName;

    @Column(name = "target_department_id")
    private UUID targetDepartmentId;

    @Column(name = "target_department_name", length = 200)
    private String targetDepartmentName;

    @Column(name = "target_position_id")
    private UUID targetPositionId;

    @Column(name = "target_position_name", length = 100)
    private String targetPositionName;

    @Column(name = "target_grade_id")
    private UUID targetGradeId;

    @Column(name = "target_grade_name", length = 100)
    private String targetGradeName;

    // 전출/전입 정보
    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TransferStatus status = TransferStatus.DRAFT;

    // 승인 정보
    @Column(name = "source_approver_id")
    private UUID sourceApproverId;

    @Column(name = "source_approver_name", length = 100)
    private String sourceApproverName;

    @Column(name = "source_approved_at")
    private java.time.LocalDateTime sourceApprovedAt;

    @Column(name = "target_approver_id")
    private UUID targetApproverId;

    @Column(name = "target_approver_name", length = 100)
    private String targetApproverName;

    @Column(name = "target_approved_at")
    private java.time.LocalDateTime targetApprovedAt;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(name = "completed_at")
    private java.time.LocalDateTime completedAt;

    @Builder
    public TransferRequest(UUID employeeId, String employeeName, String employeeNumber,
                           UUID sourceTenantId, String sourceTenantName,
                           UUID sourceDepartmentId, String sourceDepartmentName,
                           UUID sourcePositionId, String sourcePositionName,
                           UUID sourceGradeId, String sourceGradeName,
                           UUID targetTenantId, String targetTenantName,
                           UUID targetDepartmentId, String targetDepartmentName,
                           UUID targetPositionId, String targetPositionName,
                           UUID targetGradeId, String targetGradeName,
                           LocalDate transferDate, String reason) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.employeeNumber = employeeNumber;
        this.sourceTenantId = sourceTenantId;
        this.sourceTenantName = sourceTenantName;
        this.sourceDepartmentId = sourceDepartmentId;
        this.sourceDepartmentName = sourceDepartmentName;
        this.sourcePositionId = sourcePositionId;
        this.sourcePositionName = sourcePositionName;
        this.sourceGradeId = sourceGradeId;
        this.sourceGradeName = sourceGradeName;
        this.targetTenantId = targetTenantId;
        this.targetTenantName = targetTenantName;
        this.targetDepartmentId = targetDepartmentId;
        this.targetDepartmentName = targetDepartmentName;
        this.targetPositionId = targetPositionId;
        this.targetPositionName = targetPositionName;
        this.targetGradeId = targetGradeId;
        this.targetGradeName = targetGradeName;
        this.transferDate = transferDate;
        this.reason = reason;
        this.status = TransferStatus.DRAFT;
    }

    public void update(UUID targetDepartmentId, String targetDepartmentName,
                       UUID targetPositionId, String targetPositionName,
                       UUID targetGradeId, String targetGradeName,
                       LocalDate transferDate, String reason) {
        if (targetDepartmentId != null) {
            this.targetDepartmentId = targetDepartmentId;
            this.targetDepartmentName = targetDepartmentName;
        }
        if (targetPositionId != null) {
            this.targetPositionId = targetPositionId;
            this.targetPositionName = targetPositionName;
        }
        if (targetGradeId != null) {
            this.targetGradeId = targetGradeId;
            this.targetGradeName = targetGradeName;
        }
        if (transferDate != null) {
            this.transferDate = transferDate;
        }
        if (reason != null) {
            this.reason = reason;
        }
    }

    public void submit() {
        this.status = TransferStatus.PENDING;
    }

    public void approveSource(UUID approverId, String approverName) {
        this.sourceApproverId = approverId;
        this.sourceApproverName = approverName;
        this.sourceApprovedAt = java.time.LocalDateTime.now();
        this.status = TransferStatus.SOURCE_APPROVED;
    }

    public void approveTarget(UUID approverId, String approverName) {
        this.targetApproverId = approverId;
        this.targetApproverName = approverName;
        this.targetApprovedAt = java.time.LocalDateTime.now();
        this.status = TransferStatus.APPROVED;
    }

    public void reject(String reason) {
        this.status = TransferStatus.REJECTED;
        this.rejectReason = reason;
    }

    public void complete() {
        this.status = TransferStatus.COMPLETED;
        this.completedAt = java.time.LocalDateTime.now();
    }

    public void cancel() {
        this.status = TransferStatus.CANCELLED;
    }

    public boolean isDraft() {
        return this.status == TransferStatus.DRAFT;
    }

    public boolean isPending() {
        return this.status == TransferStatus.PENDING;
    }

    public boolean isSourceApproved() {
        return this.status == TransferStatus.SOURCE_APPROVED;
    }

    public boolean canBeModified() {
        return this.status == TransferStatus.DRAFT;
    }

    public boolean canBeSubmitted() {
        return this.status == TransferStatus.DRAFT;
    }

    public boolean canBeDeleted() {
        return this.status == TransferStatus.DRAFT;
    }
}
