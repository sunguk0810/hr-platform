package com.hrsaas.employee.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "card_issue_request", schema = "hr_core")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CardIssueRequest extends TenantAwareEntity {

    @Column(name = "request_number", nullable = false, length = 50)
    private String requestNumber;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false, length = 20)
    private CardIssueType issueType;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CardIssueRequestStatus status = CardIssueRequestStatus.PENDING;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "issued_card_id")
    private UUID issuedCardId;

    @Builder
    public CardIssueRequest(String requestNumber, UUID employeeId,
                            CardIssueType issueType, String reason) {
        this.requestNumber = requestNumber;
        this.employeeId = employeeId;
        this.issueType = issueType;
        this.reason = reason;
        this.status = CardIssueRequestStatus.PENDING;
    }

    public void approve(UUID approvedBy) {
        this.status = CardIssueRequestStatus.APPROVED;
        this.approvedBy = approvedBy;
        this.approvedAt = Instant.now();
    }

    public void reject(String reason) {
        this.status = CardIssueRequestStatus.REJECTED;
        this.rejectionReason = reason;
    }

    public void markIssued(UUID cardId) {
        this.status = CardIssueRequestStatus.ISSUED;
        this.issuedCardId = cardId;
    }

    public boolean isPending() {
        return this.status == CardIssueRequestStatus.PENDING;
    }
}
