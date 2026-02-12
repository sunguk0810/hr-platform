package com.hrsaas.appointment.listener;

import com.hrsaas.appointment.domain.entity.AppointmentDraft;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import com.hrsaas.appointment.repository.AppointmentDraftRepository;
import com.hrsaas.appointment.service.AppointmentDraftService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalCompletedListenerTest {

    @Mock
    private AppointmentDraftRepository draftRepository;

    @Mock
    private AppointmentDraftService draftService;

    @InjectMocks
    private ApprovalCompletedListener listener;

    private UUID draftId;
    private AppointmentDraft draft;

    @BeforeEach
    void setUp() {
        draftId = UUID.randomUUID();
        draft = AppointmentDraft.builder()
                .draftNumber("APT-2025-0001")
                .title("Test Draft")
                .effectiveDate(LocalDate.now())
                .description("Test Description")
                .build();

        // Use reflection to set ID since it's a private field in BaseEntity/TenantAwareEntity
        ReflectionTestUtils.setField(draft, "id", draftId);

        // Transition to PENDING_APPROVAL
        draft.submit(UUID.randomUUID());
    }

    @Test
    @DisplayName("승인 완료 시 발령일이 오늘이면 즉시 실행되어야 한다")
    void handleApprovalCompleted_Approved_ImmediateExecution() {
        // Given
        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));

        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "APPOINTMENT",
              "referenceId": "%s",
              "status": "APPROVED",
              "actorId": "%s"
            }
            """, draftId, UUID.randomUUID());

        // When
        listener.handleMessage(message);

        // Then
        verify(draftRepository).save(draft);
        verify(draftService).execute(draftId);
    }

    @Test
    @DisplayName("승인 완료 시 발령일이 미래이면 실행되지 않아야 한다")
    void handleApprovalCompleted_Approved_FutureExecution() {
        // Given
        // Set effective date to tomorrow
        ReflectionTestUtils.setField(draft, "effectiveDate", LocalDate.now().plusDays(1));

        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));

        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "APPOINTMENT",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, draftId);

        // When
        listener.handleMessage(message);

        // Then
        verify(draftRepository).save(draft); // Status updated to APPROVED
        verify(draftService, never()).execute(any()); // Not executed
    }

    @Test
    @DisplayName("반려 시 상태만 변경되고 실행되지 않아야 한다")
    void handleApprovalCompleted_Rejected() {
        // Given
        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));

        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "APPOINTMENT",
              "referenceId": "%s",
              "status": "REJECTED",
              "reason": "Rejected"
            }
            """, draftId);

        // When
        listener.handleMessage(message);

        // Then
        verify(draftRepository).save(draft); // Status updated to REJECTED
        verify(draftService, never()).execute(any());
    }

    @Test
    @DisplayName("실행 중 예외가 발생해도 승인 상태는 유지되어야 한다")
    void handleApprovalCompleted_ExecutionFails() {
        // Given
        when(draftRepository.findById(draftId)).thenReturn(Optional.of(draft));
        doThrow(new RuntimeException("Execution failed")).when(draftService).execute(draftId);

        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "APPOINTMENT",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, draftId);

        // When
        listener.handleMessage(message);

        // Then
        verify(draftRepository).save(draft); // Should still be saved as APPROVED
        verify(draftService).execute(draftId); // Execution attempted
        // No exception thrown up
    }

    @Test
    @DisplayName("다른 문서 타입은 무시해야 한다")
    void handleApprovalCompleted_OtherDocumentType() {
        // Given
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "OTHER_TYPE",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, draftId);

        // When
        listener.handleMessage(message);

        // Then
        verify(draftRepository, never()).findById(any());
        verify(draftService, never()).execute(any());
    }
}
