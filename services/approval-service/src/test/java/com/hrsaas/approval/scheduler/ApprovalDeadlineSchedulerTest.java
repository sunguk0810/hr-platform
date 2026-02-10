package com.hrsaas.approval.scheduler;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalLine;
import com.hrsaas.approval.domain.entity.ApprovalLineStatus;
import com.hrsaas.approval.repository.ApprovalDocumentRepository;
import com.hrsaas.common.event.EventPublisher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalDeadlineSchedulerTest {

    @Mock
    private ApprovalDocumentRepository documentRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private ApprovalDeadlineScheduler scheduler;

    @Test
    @DisplayName("checkOverdueApprovals - no overdue documents - does nothing")
    void checkOverdueApprovals_noOverdue_doesNothing() {
        when(documentRepository.findOverdueDocuments(any(Instant.class)))
                .thenReturn(Collections.emptyList());

        scheduler.checkOverdueApprovals();

        verify(documentRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkOverdueApprovals - overdue documents exist - marks escalated")
    void checkOverdueApprovals_overdueExists_marksEscalated() {
        ApprovalDocument document = mock(ApprovalDocument.class);
        ApprovalLine activeLine = mock(ApprovalLine.class);
        when(activeLine.getStatus()).thenReturn(ApprovalLineStatus.ACTIVE);
        when(activeLine.getApproverName()).thenReturn("김승인");
        when(document.getApprovalLines()).thenReturn(List.of(activeLine));
        when(document.getDeadlineAt()).thenReturn(Instant.now().minusSeconds(3600));

        when(documentRepository.findOverdueDocuments(any(Instant.class)))
                .thenReturn(List.of(document));

        scheduler.checkOverdueApprovals();

        verify(document).setEscalated(true);
        verify(documentRepository).save(document);
    }

    @Test
    @DisplayName("checkOverdueApprovals - escalation fails for one document - continues processing others")
    void checkOverdueApprovals_partialFailure_continuesProcessing() {
        ApprovalDocument doc1 = mock(ApprovalDocument.class);
        ApprovalDocument doc2 = mock(ApprovalDocument.class);
        when(doc1.getApprovalLines()).thenThrow(new RuntimeException("Test error"));
        ApprovalLine activeLine = mock(ApprovalLine.class);
        when(activeLine.getStatus()).thenReturn(ApprovalLineStatus.ACTIVE);
        when(activeLine.getApproverName()).thenReturn("이결재");
        when(doc2.getApprovalLines()).thenReturn(List.of(activeLine));

        when(documentRepository.findOverdueDocuments(any(Instant.class)))
                .thenReturn(List.of(doc1, doc2));

        scheduler.checkOverdueApprovals();

        // doc1 gets setEscalated(true) before getApprovalLines() throws
        verify(doc1).setEscalated(true);
        verify(documentRepository, never()).save(doc1);
        verify(doc2).setEscalated(true);
        verify(documentRepository).save(doc2);
    }
}
