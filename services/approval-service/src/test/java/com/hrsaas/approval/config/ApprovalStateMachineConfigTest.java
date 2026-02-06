package com.hrsaas.approval.config;

import com.hrsaas.approval.domain.entity.ApprovalStatus;
import com.hrsaas.approval.statemachine.ApprovalAction;
import com.hrsaas.approval.statemachine.ApprovalEvent;
import com.hrsaas.approval.statemachine.ApprovalGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.statemachine.support.DefaultStateMachineContext;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for the approval state machine configuration.
 * Verifies correct state transitions for the approval workflow.
 */
@SpringBootTest(
    classes = {
        ApprovalStateMachineConfig.class,
        ApprovalGuard.class,
        ApprovalAction.class
    },
    properties = {
        "spring.main.banner-mode=off"
    }
)
class ApprovalStateMachineConfigTest {

    @Autowired
    private StateMachineFactory<ApprovalStatus, ApprovalEvent> stateMachineFactory;

    private StateMachine<ApprovalStatus, ApprovalEvent> stateMachine;

    @BeforeEach
    void setUp() {
        stateMachine = stateMachineFactory.getStateMachine();
        stateMachine.startReactively().block();
    }

    /**
     * Resets the state machine to a given state for testing transitions from non-initial states.
     */
    private void resetToState(ApprovalStatus state) {
        stateMachine.stopReactively().block();
        stateMachine.getStateMachineAccessor()
            .doWithAllRegions(accessor -> {
                accessor.resetStateMachineReactively(
                    new DefaultStateMachineContext<>(state, null, null, null)
                ).block();
            });
        stateMachine.startReactively().block();
    }

    /**
     * Sends an event to the state machine using the reactive API.
     */
    private void sendEvent(ApprovalEvent event) {
        stateMachine.sendEvent(
            Mono.just(MessageBuilder.withPayload(event).build())
        ).blockLast();
    }

    @Test
    @DisplayName("DRAFT -> IN_PROGRESS on SUBMIT event")
    void testStateMachine_DraftToInProgress_OnSubmit() {
        // Given: state machine is in DRAFT state (initial)
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.DRAFT);

        // When: SUBMIT event is sent
        sendEvent(ApprovalEvent.SUBMIT);

        // Then: state transitions to IN_PROGRESS
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("IN_PROGRESS -> APPROVED on COMPLETE event")
    void testStateMachine_InProgressToApproved_OnComplete() {
        // Given: state machine is in IN_PROGRESS state
        resetToState(ApprovalStatus.IN_PROGRESS);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.IN_PROGRESS);

        // When: COMPLETE event is sent
        sendEvent(ApprovalEvent.COMPLETE);

        // Then: state transitions to APPROVED
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.APPROVED);
    }

    @Test
    @DisplayName("IN_PROGRESS -> REJECTED on REJECT_LINE event")
    void testStateMachine_InProgressToRejected_OnRejectLine() {
        // Given: state machine is in IN_PROGRESS state
        resetToState(ApprovalStatus.IN_PROGRESS);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.IN_PROGRESS);

        // When: REJECT_LINE event is sent
        sendEvent(ApprovalEvent.REJECT_LINE);

        // Then: state transitions to REJECTED
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.REJECTED);
    }

    @Test
    @DisplayName("DRAFT cannot RECALL - no transition defined from DRAFT for RECALL")
    void testStateMachine_DraftToRecalled_OnRecall() {
        // Given: state machine is in DRAFT state (initial)
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.DRAFT);

        // When: RECALL event is sent
        sendEvent(ApprovalEvent.RECALL);

        // Then: state remains DRAFT (no transition from DRAFT on RECALL)
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.DRAFT);
    }

    @Test
    @DisplayName("IN_PROGRESS -> RECALLED on RECALL event")
    void testStateMachine_InProgressToRecalled_OnRecall() {
        // Given: state machine is in IN_PROGRESS state
        resetToState(ApprovalStatus.IN_PROGRESS);
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.IN_PROGRESS);

        // When: RECALL event is sent
        sendEvent(ApprovalEvent.RECALL);

        // Then: state transitions to RECALLED
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.RECALLED);
    }

    @Test
    @DisplayName("DRAFT -> CANCELED on CANCEL event")
    void testStateMachine_DraftToCanceled_OnCancel() {
        // Given: state machine is in DRAFT state (initial)
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.DRAFT);

        // When: CANCEL event is sent
        sendEvent(ApprovalEvent.CANCEL);

        // Then: state transitions to CANCELED
        assertThat(stateMachine.getState().getId()).isEqualTo(ApprovalStatus.CANCELED);
    }
}
