package com.hrsaas.appointment.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 발령안 Entity
 */
@Entity
@Table(name = "appointment_draft", schema = "hr_appointment")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppointmentDraft extends TenantAwareEntity {

    @Column(name = "draft_number", nullable = false, length = 50)
    private String draftNumber;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DraftStatus status = DraftStatus.DRAFT;

    @Column(name = "approval_id")
    private UUID approvalId;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "executed_by")
    private UUID executedBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<AppointmentDetail> details = new ArrayList<>();

    @Builder
    public AppointmentDraft(String draftNumber, String title, LocalDate effectiveDate,
                            String description) {
        this.draftNumber = draftNumber;
        this.title = title;
        this.effectiveDate = effectiveDate;
        this.description = description;
        this.status = DraftStatus.DRAFT;
    }

    public void addDetail(AppointmentDetail detail) {
        details.add(detail);
        detail.setDraft(this);
    }

    public void removeDetail(AppointmentDetail detail) {
        details.remove(detail);
        detail.setDraft(null);
    }

    public void submit(UUID approvalId) {
        this.approvalId = approvalId;
        this.status = DraftStatus.PENDING_APPROVAL;
    }

    public void approve(UUID approvedBy) {
        this.approvedBy = approvedBy;
        this.approvedAt = Instant.now();
        this.status = DraftStatus.APPROVED;
    }

    public void reject() {
        this.status = DraftStatus.REJECTED;
    }

    public void execute(UUID executedBy) {
        this.executedBy = executedBy;
        this.executedAt = Instant.now();
        this.status = DraftStatus.EXECUTED;
    }

    public void cancel(UUID cancelledBy, String reason) {
        this.cancelledBy = cancelledBy;
        this.cancelledAt = Instant.now();
        this.cancelReason = reason;
        this.status = DraftStatus.CANCELLED;
    }

    public boolean isEditable() {
        return status == DraftStatus.DRAFT || status == DraftStatus.REJECTED;
    }

    public boolean isExecutable() {
        return status == DraftStatus.APPROVED;
    }
}
