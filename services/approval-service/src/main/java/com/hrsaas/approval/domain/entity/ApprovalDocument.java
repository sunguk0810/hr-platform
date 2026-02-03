package com.hrsaas.approval.domain.entity;

import com.hrsaas.common.entity.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "approval_document", schema = "hr_approval")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ApprovalDocument extends TenantAwareEntity {

    @Column(name = "document_number", nullable = false, unique = true)
    private String documentNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "document_type", nullable = false)
    private String documentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.DRAFT;

    @Column(name = "drafter_id", nullable = false)
    private UUID drafterId;

    @Column(name = "drafter_name", nullable = false)
    private String drafterName;

    @Column(name = "drafter_department_id")
    private UUID drafterDepartmentId;

    @Column(name = "drafter_department_name")
    private String drafterDepartmentName;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<ApprovalLine> approvalLines = new ArrayList<>();

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<ApprovalHistory> histories = new ArrayList<>();

    public void submit() {
        if (this.status != ApprovalStatus.DRAFT) {
            throw new IllegalStateException("Only draft documents can be submitted");
        }
        this.status = ApprovalStatus.PENDING;
        this.submittedAt = Instant.now();
        activateFirstLine();
    }

    public void recall() {
        if (this.status != ApprovalStatus.PENDING && this.status != ApprovalStatus.IN_PROGRESS) {
            throw new IllegalStateException("Only pending or in-progress documents can be recalled");
        }
        this.status = ApprovalStatus.RECALLED;
    }

    public void cancel() {
        if (this.status != ApprovalStatus.DRAFT && this.status != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Only draft or pending documents can be canceled");
        }
        this.status = ApprovalStatus.CANCELED;
    }

    private void activateFirstLine() {
        if (!approvalLines.isEmpty()) {
            approvalLines.get(0).activate();
            this.status = ApprovalStatus.IN_PROGRESS;
        }
    }

    public void addApprovalLine(ApprovalLine line) {
        approvalLines.add(line);
        line.setDocument(this);
        line.setSequence(approvalLines.size());
    }

    public void addHistory(ApprovalHistory history) {
        histories.add(history);
        history.setDocument(this);
    }

    public void processLineCompletion(ApprovalLine completedLine) {
        if (completedLine.isRejected()) {
            this.status = ApprovalStatus.REJECTED;
            this.completedAt = Instant.now();
            return;
        }

        int nextSequence = completedLine.getSequence() + 1;
        ApprovalLine nextLine = approvalLines.stream()
            .filter(l -> l.getSequence() == nextSequence)
            .findFirst()
            .orElse(null);

        if (nextLine != null) {
            nextLine.activate();
        } else {
            this.status = ApprovalStatus.APPROVED;
            this.completedAt = Instant.now();
        }
    }
}
