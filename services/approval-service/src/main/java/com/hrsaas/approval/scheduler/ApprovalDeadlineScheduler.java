package com.hrsaas.approval.scheduler;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalLine;
import com.hrsaas.approval.domain.entity.ApprovalLineStatus;
import com.hrsaas.approval.repository.ApprovalDocumentRepository;
import com.hrsaas.common.event.EventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * APR-G10: 결재 마감일 자동 에스컬레이션 스케줄러
 * 마감일이 지난 결재 문서를 감지하고 에스컬레이션 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalDeadlineScheduler {

    private final ApprovalDocumentRepository documentRepository;
    private final EventPublisher eventPublisher;

    /**
     * 매시간 마감일 초과 결재 문서 확인
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void checkOverdueApprovals() {
        List<ApprovalDocument> overdueDocuments = documentRepository.findOverdueDocuments(Instant.now());

        if (overdueDocuments.isEmpty()) {
            return;
        }

        log.info("Found {} overdue approval documents", overdueDocuments.size());

        for (ApprovalDocument document : overdueDocuments) {
            try {
                escalateDocument(document);
            } catch (Exception e) {
                log.error("Failed to escalate document: id={}", document.getId(), e);
            }
        }
    }

    private void escalateDocument(ApprovalDocument document) {
        document.setEscalated(true);

        // Find current active approver for notification
        document.getApprovalLines().stream()
            .filter(l -> l.getStatus() == ApprovalLineStatus.ACTIVE)
            .findFirst()
            .ifPresent(activeLine -> {
                log.info("Escalating overdue approval: documentId={}, approver={}, deadline={}",
                    document.getId(), activeLine.getApproverName(), document.getDeadlineAt());
            });

        documentRepository.save(document);
    }
}
