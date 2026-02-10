package com.hrsaas.approval.statemachine;

import com.hrsaas.approval.domain.entity.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.action.Action;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
public class ApprovalAction {

    /**
     * Action: 첫 번째 결재선 활성화
     */
    public Action<ApprovalStatus, ApprovalEvent> activateFirstLine() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            if (document == null || document.getApprovalLines().isEmpty()) return;

            document.setSubmittedAt(Instant.now());
            activateNextLines(document, 0);
            log.debug("First approval line activated for document: {}", document.getId());
        };
    }

    /**
     * Action: 다음 시퀀스 결재선 활성화
     */
    public Action<ApprovalStatus, ApprovalEvent> activateNextLine() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            ApprovalLine completedLine = getCompletedLine(context);
            if (document == null || completedLine == null) return;

            activateNextLines(document, completedLine.getSequence());
            log.debug("Next approval line activated: sequence={}", completedLine.getSequence() + 1);
        };
    }

    /**
     * Action: 문서 승인 완료 처리
     */
    public Action<ApprovalStatus, ApprovalEvent> completeApproval() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            if (document == null) return;

            document.setCompletedAt(Instant.now());
            log.info("Approval document completed: id={}", document.getId());
        };
    }

    /**
     * Action: 문서 반려 처리
     */
    public Action<ApprovalStatus, ApprovalEvent> rejectDocument() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            if (document == null) return;

            document.setCompletedAt(Instant.now());
            log.info("Approval document rejected: id={}", document.getId());
        };
    }

    /**
     * Action: 전결 처리 - 이후 모든 결재선 건너뜀
     */
    public Action<ApprovalStatus, ApprovalEvent> processArbitraryApproval() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            ApprovalLine completedLine = getCompletedLine(context);
            if (document == null || completedLine == null) return;

            int currentSequence = completedLine.getSequence();
            document.getApprovalLines().stream()
                .filter(line -> line.getSequence() > currentSequence)
                .filter(line -> line.getStatus() == ApprovalLineStatus.WAITING)
                .forEach(ApprovalLine::skip);

            document.setCompletedAt(Instant.now());
            log.info("Arbitrary approval processed: documentId={}, skipAfterSequence={}",
                document.getId(), currentSequence);
        };
    }

    /**
     * Action: 반송 처리 - DRAFT로 복원 + 결재선 초기화
     */
    public Action<ApprovalStatus, ApprovalEvent> returnToDraft() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            if (document == null) return;

            document.returnToDraft();
            log.info("Approval document returned to draft: id={}, returnCount={}",
                document.getId(), document.getReturnCount());
        };
    }

    private void activateNextLines(ApprovalDocument document, int fromSequence) {
        int nextSequence = fromSequence + 1;
        List<ApprovalLine> nextLines = document.getApprovalLines().stream()
            .filter(l -> l.getSequence() == nextSequence)
            .filter(l -> l.getStatus() == ApprovalLineStatus.WAITING)
            .toList();

        if (nextLines.isEmpty()) return;

        boolean isParallel = nextLines.stream()
            .anyMatch(l -> l.getLineType() == ApprovalLineType.PARALLEL);

        if (isParallel) {
            nextLines.forEach(ApprovalLine::activate);
        } else {
            nextLines.stream().findFirst().ifPresent(ApprovalLine::activate);
        }
    }

    private ApprovalDocument getDocument(StateContext<ApprovalStatus, ApprovalEvent> context) {
        return context.getExtendedState().get("document", ApprovalDocument.class);
    }

    private ApprovalLine getCompletedLine(StateContext<ApprovalStatus, ApprovalEvent> context) {
        return context.getExtendedState().get("completedLine", ApprovalLine.class);
    }
}
