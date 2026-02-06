package com.hrsaas.approval.statemachine;

import com.hrsaas.approval.domain.entity.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.guard.Guard;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class ApprovalGuard {

    /**
     * Guard: 병렬 결재 그룹 완료 여부 체크
     */
    public Guard<ApprovalStatus, ApprovalEvent> parallelGroupCompleted() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            ApprovalLine completedLine = getCompletedLine(context);
            if (completedLine == null || document == null) return true;

            if (completedLine.getLineType() != ApprovalLineType.PARALLEL) {
                return true;
            }

            int sequence = completedLine.getSequence();
            boolean allCompleted = document.getApprovalLines().stream()
                .filter(l -> l.getSequence() == sequence)
                .filter(l -> l.getLineType() == ApprovalLineType.PARALLEL)
                .allMatch(ApprovalLine::isCompleted);

            log.debug("Parallel group completed check: sequence={}, result={}", sequence, allCompleted);
            return allCompleted;
        };
    }

    /**
     * Guard: 전결 조건 체크 - 현재 라인이 ARBITRARY 타입인지
     */
    public Guard<ApprovalStatus, ApprovalEvent> isArbitraryApproval() {
        return context -> {
            ApprovalLine completedLine = getCompletedLine(context);
            return completedLine != null &&
                   completedLine.getLineType() == ApprovalLineType.ARBITRARY &&
                   completedLine.getStatus() == ApprovalLineStatus.APPROVED;
        };
    }

    /**
     * Guard: 다음 결재선이 존재하는지 체크
     */
    public Guard<ApprovalStatus, ApprovalEvent> hasNextLine() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            ApprovalLine completedLine = getCompletedLine(context);
            if (document == null || completedLine == null) return false;

            int nextSequence = completedLine.getSequence() + 1;
            return document.getApprovalLines().stream()
                .anyMatch(l -> l.getSequence() == nextSequence &&
                              l.getStatus() == ApprovalLineStatus.WAITING);
        };
    }

    /**
     * Guard: 모든 결재선이 완료되었는지 체크
     */
    public Guard<ApprovalStatus, ApprovalEvent> allLinesCompleted() {
        return context -> {
            ApprovalDocument document = getDocument(context);
            ApprovalLine completedLine = getCompletedLine(context);
            if (document == null || completedLine == null) return false;

            int nextSequence = completedLine.getSequence() + 1;
            boolean noMoreLines = document.getApprovalLines().stream()
                .noneMatch(l -> l.getSequence() >= nextSequence &&
                               l.getStatus() == ApprovalLineStatus.WAITING);
            return noMoreLines;
        };
    }

    private ApprovalDocument getDocument(StateContext<ApprovalStatus, ApprovalEvent> context) {
        return context.getExtendedState().get("document", ApprovalDocument.class);
    }

    private ApprovalLine getCompletedLine(StateContext<ApprovalStatus, ApprovalEvent> context) {
        return context.getExtendedState().get("completedLine", ApprovalLine.class);
    }
}
