package com.hrsaas.organization.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 정현원 변경 요청 엔티티
 */
@Entity
@Table(name = "headcount_request", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HeadcountRequest extends TenantAwareEntity {

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "department_name", length = 200)
    private String departmentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private HeadcountRequestType type;

    @Column(name = "request_count", nullable = false)
    private Integer requestCount;

    @Column(name = "grade_id")
    private UUID gradeId;

    @Column(name = "grade_name", length = 100)
    private String gradeName;

    @Column(name = "position_id")
    private UUID positionId;

    @Column(name = "position_name", length = 100)
    private String positionName;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private HeadcountRequestStatus status = HeadcountRequestStatus.DRAFT;

    @Column(name = "approval_id")
    private UUID approvalId;

    @Column(name = "requester_id")
    private UUID requesterId;

    @Column(name = "requester_name", length = 100)
    private String requesterName;

    @Builder
    public HeadcountRequest(UUID departmentId, String departmentName, HeadcountRequestType type,
                            Integer requestCount, UUID gradeId, String gradeName,
                            UUID positionId, String positionName, String reason,
                            LocalDate effectiveDate, UUID requesterId, String requesterName) {
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.type = type;
        this.requestCount = requestCount;
        this.gradeId = gradeId;
        this.gradeName = gradeName;
        this.positionId = positionId;
        this.positionName = positionName;
        this.reason = reason;
        this.effectiveDate = effectiveDate;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.status = HeadcountRequestStatus.DRAFT;
    }

    public void update(HeadcountRequestType type, Integer requestCount,
                       UUID gradeId, String gradeName, UUID positionId, String positionName,
                       String reason, LocalDate effectiveDate) {
        if (type != null) {
            this.type = type;
        }
        if (requestCount != null) {
            this.requestCount = requestCount;
        }
        if (gradeId != null) {
            this.gradeId = gradeId;
            this.gradeName = gradeName;
        }
        if (positionId != null) {
            this.positionId = positionId;
            this.positionName = positionName;
        }
        if (reason != null) {
            this.reason = reason;
        }
        if (effectiveDate != null) {
            this.effectiveDate = effectiveDate;
        }
    }

    public void submit() {
        this.status = HeadcountRequestStatus.PENDING;
    }

    public void approve(UUID approvalId) {
        this.status = HeadcountRequestStatus.APPROVED;
        this.approvalId = approvalId;
    }

    public void reject() {
        this.status = HeadcountRequestStatus.REJECTED;
    }

    public void cancel() {
        this.status = HeadcountRequestStatus.DRAFT;
    }

    public boolean isDraft() {
        return this.status == HeadcountRequestStatus.DRAFT;
    }

    public boolean isPending() {
        return this.status == HeadcountRequestStatus.PENDING;
    }

    public boolean isApproved() {
        return this.status == HeadcountRequestStatus.APPROVED;
    }
}
