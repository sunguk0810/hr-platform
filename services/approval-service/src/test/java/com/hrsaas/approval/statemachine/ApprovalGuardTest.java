package com.hrsaas.approval.statemachine;

import com.hrsaas.approval.domain.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.statemachine.ExtendedState;
import org.springframework.statemachine.StateContext;
import org.springframework.statemachine.guard.Guard;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the ApprovalGuard state machine guards.
 * Each guard is tested by mocking the StateContext and ExtendedState
 * to provide the required document and approval line data.
 */
@ExtendWith(MockitoExtension.class)
class ApprovalGuardTest {

    @InjectMocks
    private ApprovalGuard approvalGuard;

    private StateContext<ApprovalStatus, ApprovalEvent> stateContext;
    private ExtendedState extendedState;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        stateContext = mock(StateContext.class);
        extendedState = mock(ExtendedState.class);
        when(stateContext.getExtendedState()).thenReturn(extendedState);
    }

    // --- parallelGroupCompleted ---

    @Test
    @DisplayName("parallelGroupCompleted: all parallel lines completed returns true")
    void parallelGroupCompleted_allParallelLinesCompleted_returnsTrue() {
        // Given: a document with two parallel lines at sequence 1, both completed
        ApprovalDocument document = mock(ApprovalDocument.class);
        ApprovalLine completedLine = mock(ApprovalLine.class);

        when(extendedState.get("document", ApprovalDocument.class)).thenReturn(document);
        when(extendedState.get("completedLine", ApprovalLine.class)).thenReturn(completedLine);

        when(completedLine.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(completedLine.getSequence()).thenReturn(1);

        ApprovalLine parallelLine1 = mock(ApprovalLine.class);
        when(parallelLine1.getSequence()).thenReturn(1);
        when(parallelLine1.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(parallelLine1.isCompleted()).thenReturn(true);

        ApprovalLine parallelLine2 = mock(ApprovalLine.class);
        when(parallelLine2.getSequence()).thenReturn(1);
        when(parallelLine2.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(parallelLine2.isCompleted()).thenReturn(true);

        when(document.getApprovalLines()).thenReturn(List.of(parallelLine1, parallelLine2));

        // When
        Guard<ApprovalStatus, ApprovalEvent> guard = approvalGuard.parallelGroupCompleted();
        boolean result = guard.evaluate(stateContext);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("parallelGroupCompleted: some parallel lines still pending returns false")
    void parallelGroupCompleted_someParallelLinesPending_returnsFalse() {
        // Given: a document with two parallel lines at sequence 1, one still pending
        ApprovalDocument document = mock(ApprovalDocument.class);
        ApprovalLine completedLine = mock(ApprovalLine.class);

        when(extendedState.get("document", ApprovalDocument.class)).thenReturn(document);
        when(extendedState.get("completedLine", ApprovalLine.class)).thenReturn(completedLine);

        when(completedLine.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(completedLine.getSequence()).thenReturn(1);

        ApprovalLine parallelLine1 = mock(ApprovalLine.class);
        when(parallelLine1.getSequence()).thenReturn(1);
        when(parallelLine1.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(parallelLine1.isCompleted()).thenReturn(true);

        ApprovalLine parallelLine2 = mock(ApprovalLine.class);
        when(parallelLine2.getSequence()).thenReturn(1);
        when(parallelLine2.getLineType()).thenReturn(ApprovalLineType.PARALLEL);
        when(parallelLine2.isCompleted()).thenReturn(false);

        when(document.getApprovalLines()).thenReturn(List.of(parallelLine1, parallelLine2));

        // When
        Guard<ApprovalStatus, ApprovalEvent> guard = approvalGuard.parallelGroupCompleted();
        boolean result = guard.evaluate(stateContext);

        // Then
        assertThat(result).isFalse();
    }

    // --- isArbitraryApproval ---

    @Test
    @DisplayName("isArbitraryApproval: ARBITRARY line type with APPROVED status returns true")
    void isArbitraryApproval_arbitraryLineType_returnsTrue() {
        // Given: a completed line with ARBITRARY type and APPROVED status
        ApprovalLine completedLine = mock(ApprovalLine.class);
        when(extendedState.get("completedLine", ApprovalLine.class)).thenReturn(completedLine);
        when(completedLine.getLineType()).thenReturn(ApprovalLineType.ARBITRARY);
        when(completedLine.getStatus()).thenReturn(ApprovalLineStatus.APPROVED);

        // When
        Guard<ApprovalStatus, ApprovalEvent> guard = approvalGuard.isArbitraryApproval();
        boolean result = guard.evaluate(stateContext);

        // Then
        assertThat(result).isTrue();
    }

    // --- hasNextLine ---

    @Test
    @DisplayName("hasNextLine: next line exists in WAITING status returns true")
    void hasNextLine_nextLineExists_returnsTrue() {
        // Given: a document with a waiting line at the next sequence
        ApprovalDocument document = mock(ApprovalDocument.class);
        ApprovalLine completedLine = mock(ApprovalLine.class);

        when(extendedState.get("document", ApprovalDocument.class)).thenReturn(document);
        when(extendedState.get("completedLine", ApprovalLine.class)).thenReturn(completedLine);

        when(completedLine.getSequence()).thenReturn(1);

        ApprovalLine nextLine = mock(ApprovalLine.class);
        when(nextLine.getSequence()).thenReturn(2);
        when(nextLine.getStatus()).thenReturn(ApprovalLineStatus.WAITING);

        when(document.getApprovalLines()).thenReturn(List.of(nextLine));

        // When
        Guard<ApprovalStatus, ApprovalEvent> guard = approvalGuard.hasNextLine();
        boolean result = guard.evaluate(stateContext);

        // Then
        assertThat(result).isTrue();
    }

    // --- allLinesCompleted ---

    @Test
    @DisplayName("allLinesCompleted: no more waiting lines after current sequence returns true")
    void allLinesCompleted_allDone_returnsTrue() {
        // Given: a document where all lines at or after next sequence are completed (none waiting)
        ApprovalDocument document = mock(ApprovalDocument.class);
        ApprovalLine completedLine = mock(ApprovalLine.class);

        when(extendedState.get("document", ApprovalDocument.class)).thenReturn(document);
        when(extendedState.get("completedLine", ApprovalLine.class)).thenReturn(completedLine);

        when(completedLine.getSequence()).thenReturn(2);

        // Line at sequence 1 is already completed (before current, not checked by filter)
        ApprovalLine previousLine = mock(ApprovalLine.class);
        when(previousLine.getSequence()).thenReturn(1);

        // No lines at sequence >= 3 that are WAITING
        when(document.getApprovalLines()).thenReturn(List.of(previousLine));

        // When
        Guard<ApprovalStatus, ApprovalEvent> guard = approvalGuard.allLinesCompleted();
        boolean result = guard.evaluate(stateContext);

        // Then
        assertThat(result).isTrue();
    }
}
