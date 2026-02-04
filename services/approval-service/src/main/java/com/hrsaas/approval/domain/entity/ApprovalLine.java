package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_line", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ApprovalLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private ApprovalDocument document;

    @Column(name = "sequence", nullable = false)
    private Integer sequence;

    @Enumerated(EnumType.STRING)
    @Column(name = "line_type", nullable = false)
    @Builder.Default
    private ApprovalLineType lineType = ApprovalLineType.SEQUENTIAL;

    @Column(name = "approver_id", nullable = false)
    private UUID approverId;

    @Column(name = "approver_name", nullable = false)
    private String approverName;

    @Column(name = "approver_position")
    private String approverPosition;

    @Column(name = "approver_department_name")
    private String approverDepartmentName;

    @Column(name = "delegate_id")
    private UUID delegateId;

    @Column(name = "delegate_name")
    private String delegateName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ApprovalLineStatus status = ApprovalLineStatus.WAITING;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ApprovalActionType actionType;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public void activate() {
        if (this.status != ApprovalLineStatus.WAITING) {
            throw new IllegalStateException("Only waiting lines can be activated");
        }
        this.status = ApprovalLineStatus.ACTIVE;
        this.activatedAt = Instant.now();
    }

    public void approve(String comment) {
        validateActiveStatus();
        this.status = ApprovalLineStatus.APPROVED;
        this.actionType = ApprovalActionType.APPROVE;
        this.comment = comment;
        this.completedAt = Instant.now();
    }

    public void reject(String comment) {
        validateActiveStatus();
        this.status = ApprovalLineStatus.REJECTED;
        this.actionType = ApprovalActionType.REJECT;
        this.comment = comment;
        this.completedAt = Instant.now();
    }

    public void delegate(UUID delegateId, String delegateName) {
        validateActiveStatus();
        this.delegateId = delegateId;
        this.delegateName = delegateName;
        this.actionType = ApprovalActionType.DELEGATE;
    }

    /**
     * 합의 처리 (승인권 없이 의견만 제시)
     */
    public void agree(String comment) {
        validateActiveStatus();
        if (this.lineType != ApprovalLineType.AGREEMENT) {
            throw new IllegalStateException("Only AGREEMENT type lines can use agree action");
        }
        this.status = ApprovalLineStatus.AGREED;
        this.actionType = ApprovalActionType.AGREE;
        this.comment = comment;
        this.completedAt = Instant.now();
    }

    /**
     * 전결 처리 (이후 결재선 건너뜀)
     */
    public void approveAsArbitrary(String comment) {
        validateActiveStatus();
        this.status = ApprovalLineStatus.APPROVED;
        this.actionType = ApprovalActionType.APPROVE;
        this.comment = comment;
        this.completedAt = Instant.now();
    }

    /**
     * 결재선 건너뜀 처리 (전결로 인한 후속 결재선)
     */
    public void skip() {
        if (this.status != ApprovalLineStatus.WAITING) {
            throw new IllegalStateException("Only waiting lines can be skipped");
        }
        this.status = ApprovalLineStatus.SKIPPED;
        this.completedAt = Instant.now();
    }

    public boolean isCompleted() {
        return this.status == ApprovalLineStatus.APPROVED ||
               this.status == ApprovalLineStatus.REJECTED ||
               this.status == ApprovalLineStatus.AGREED ||
               this.status == ApprovalLineStatus.SKIPPED;
    }

    public boolean isRejected() {
        return this.status == ApprovalLineStatus.REJECTED;
    }

    public boolean isApprovedOrAgreed() {
        return this.status == ApprovalLineStatus.APPROVED || this.status == ApprovalLineStatus.AGREED;
    }

    private void validateActiveStatus() {
        if (this.status != ApprovalLineStatus.ACTIVE) {
            throw new IllegalStateException("Only active lines can be processed");
        }
    }
}
