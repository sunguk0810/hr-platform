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
@NamedEntityGraphs({
    @NamedEntityGraph(
        name = "ApprovalDocument.withLines",
        attributeNodes = @NamedAttributeNode("approvalLines")
    ),
    @NamedEntityGraph(
        name = "ApprovalDocument.withLinesAndHistories",
        attributeNodes = {
            @NamedAttributeNode("approvalLines"),
            @NamedAttributeNode("histories")
        }
    )
})
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
        if (approvalLines.isEmpty()) {
            return;
        }
        activateNextLines(0);
        this.status = ApprovalStatus.IN_PROGRESS;
    }

    /**
     * 다음 sequence의 결재선 활성화
     * PARALLEL인 경우 같은 sequence의 모든 결재자 동시 활성화
     */
    private void activateNextLines(int fromSequence) {
        int nextSequence = fromSequence + 1;
        List<ApprovalLine> nextLines = approvalLines.stream()
            .filter(l -> l.getSequence() == nextSequence)
            .filter(l -> l.getStatus() == ApprovalLineStatus.WAITING)
            .toList();

        if (nextLines.isEmpty()) {
            return;
        }

        // PARALLEL이면 모든 결재자 동시 활성화, 아니면 첫 번째만 활성화
        boolean isParallel = nextLines.stream()
            .anyMatch(l -> l.getLineType() == ApprovalLineType.PARALLEL);

        if (isParallel) {
            nextLines.forEach(ApprovalLine::activate);
        } else {
            nextLines.stream().findFirst().ifPresent(ApprovalLine::activate);
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
        // 반려인 경우 즉시 문서 반려
        if (completedLine.isRejected()) {
            this.status = ApprovalStatus.REJECTED;
            this.completedAt = Instant.now();
            return;
        }

        // 전결(ARBITRARY)인 경우 이후 모든 결재선 건너뜀
        if (completedLine.getLineType() == ApprovalLineType.ARBITRARY &&
            completedLine.getStatus() == ApprovalLineStatus.APPROVED) {
            processArbitraryApproval(completedLine);
            return;
        }

        int currentSequence = completedLine.getSequence();

        // 병렬 결재 그룹 완료 여부 확인
        if (completedLine.getLineType() == ApprovalLineType.PARALLEL) {
            if (!isParallelGroupCompleted(currentSequence)) {
                // 병렬 그룹이 아직 완료되지 않음
                return;
            }
        }

        // 다음 sequence 결재선 확인
        int nextSequence = currentSequence + 1;
        List<ApprovalLine> nextLines = approvalLines.stream()
            .filter(l -> l.getSequence() == nextSequence)
            .filter(l -> l.getStatus() == ApprovalLineStatus.WAITING)
            .toList();

        if (nextLines.isEmpty()) {
            // 더 이상 결재선 없으면 문서 승인 완료
            this.status = ApprovalStatus.APPROVED;
            this.completedAt = Instant.now();
        } else {
            activateNextLines(currentSequence);
        }
    }

    /**
     * 전결 처리 - 이후 모든 결재선 건너뜀
     */
    private void processArbitraryApproval(ApprovalLine arbitraryLine) {
        int currentSequence = arbitraryLine.getSequence();

        // 이후 모든 결재선 SKIPPED 처리
        approvalLines.stream()
            .filter(line -> line.getSequence() > currentSequence)
            .filter(line -> line.getStatus() == ApprovalLineStatus.WAITING)
            .forEach(ApprovalLine::skip);

        // 문서 최종 승인 처리
        this.status = ApprovalStatus.APPROVED;
        this.completedAt = Instant.now();
    }

    /**
     * 병렬 결재 그룹 완료 여부 확인 (모든 병렬 결재자가 처리해야 완료)
     */
    private boolean isParallelGroupCompleted(int sequence) {
        return approvalLines.stream()
            .filter(line -> line.getSequence() == sequence)
            .filter(line -> line.getLineType() == ApprovalLineType.PARALLEL)
            .allMatch(ApprovalLine::isCompleted);
    }
}
