package com.hrsaas.approval.config;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalStatus;
import com.hrsaas.approval.statemachine.ApprovalEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.statemachine.support.DefaultStateMachineContext;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalStateMachineFactory {

    private final StateMachineFactory<ApprovalStatus, ApprovalEvent> stateMachineFactory;

    /**
     * 문서의 현재 상태로 초기화된 StateMachine 인스턴스 생성
     */
    public StateMachine<ApprovalStatus, ApprovalEvent> create(ApprovalDocument document) {
        StateMachine<ApprovalStatus, ApprovalEvent> sm = stateMachineFactory.getStateMachine(document.getId().toString());

        sm.stopReactively().block();

        sm.getStateMachineAccessor()
            .doWithAllRegions(accessor -> {
                accessor.resetStateMachineReactively(
                    new DefaultStateMachineContext<>(document.getStatus(), null, null, null)
                ).block();
            });

        sm.getExtendedState().getVariables().put("document", document);
        sm.startReactively().block();

        log.debug("StateMachine created for document: id={}, currentStatus={}", document.getId(), document.getStatus());
        return sm;
    }

    /**
     * 이벤트 발송
     */
    public boolean sendEvent(StateMachine<ApprovalStatus, ApprovalEvent> sm, ApprovalEvent event) {
        Message<ApprovalEvent> message = MessageBuilder.withPayload(event).build();
        boolean accepted = sm.sendEvent(message);
        log.debug("Event sent: event={}, accepted={}, newState={}", event, accepted, sm.getState().getId());
        return accepted;
    }
}
