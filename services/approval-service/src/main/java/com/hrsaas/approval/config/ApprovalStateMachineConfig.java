package com.hrsaas.approval.config;

import com.hrsaas.approval.domain.entity.ApprovalStatus;
import com.hrsaas.approval.statemachine.ApprovalAction;
import com.hrsaas.approval.statemachine.ApprovalEvent;
import com.hrsaas.approval.statemachine.ApprovalGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.EnumStateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineConfigurationConfigurer;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;

import java.util.EnumSet;

@Configuration
@EnableStateMachineFactory
@RequiredArgsConstructor
public class ApprovalStateMachineConfig
        extends EnumStateMachineConfigurerAdapter<ApprovalStatus, ApprovalEvent> {

    private final ApprovalGuard approvalGuard;
    private final ApprovalAction approvalAction;

    @Override
    public void configure(StateMachineConfigurationConfigurer<ApprovalStatus, ApprovalEvent> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(false);
    }

    @Override
    public void configure(StateMachineStateConfigurer<ApprovalStatus, ApprovalEvent> states) throws Exception {
        states
            .withStates()
            .initial(ApprovalStatus.DRAFT)
            .states(EnumSet.allOf(ApprovalStatus.class))
            .end(ApprovalStatus.APPROVED)
            .end(ApprovalStatus.REJECTED)
            .end(ApprovalStatus.CANCELED)
            .end(ApprovalStatus.RECALLED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<ApprovalStatus, ApprovalEvent> transitions) throws Exception {
        transitions
            // DRAFT -> IN_PROGRESS (submit)
            .withExternal()
                .source(ApprovalStatus.DRAFT)
                .target(ApprovalStatus.IN_PROGRESS)
                .event(ApprovalEvent.SUBMIT)
                .action(approvalAction.activateFirstLine())
                .and()

            // DRAFT -> CANCELED
            .withExternal()
                .source(ApprovalStatus.DRAFT)
                .target(ApprovalStatus.CANCELED)
                .event(ApprovalEvent.CANCEL)
                .and()

            // IN_PROGRESS -> REJECTED (any line rejected)
            .withExternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .target(ApprovalStatus.REJECTED)
                .event(ApprovalEvent.REJECT_LINE)
                .action(approvalAction.rejectDocument())
                .and()

            // IN_PROGRESS -> APPROVED (all lines completed, no more waiting)
            .withExternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .target(ApprovalStatus.APPROVED)
                .event(ApprovalEvent.COMPLETE)
                .action(approvalAction.completeApproval())
                .and()

            // IN_PROGRESS -> APPROVED (arbitrary approval - skip remaining)
            .withExternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .target(ApprovalStatus.APPROVED)
                .event(ApprovalEvent.ARBITRARY_APPROVE)
                .action(approvalAction.processArbitraryApproval())
                .and()

            // IN_PROGRESS -> IN_PROGRESS (approve line, more lines remain)
            .withInternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .event(ApprovalEvent.APPROVE_LINE)
                .guard(approvalGuard.parallelGroupCompleted())
                .action(approvalAction.activateNextLine())
                .and()

            // IN_PROGRESS -> IN_PROGRESS (agree line - no status change)
            .withInternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .event(ApprovalEvent.AGREE_LINE)
                .and()

            // IN_PROGRESS -> DRAFT (return - 반송)
            .withExternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .target(ApprovalStatus.DRAFT)
                .event(ApprovalEvent.RETURN_LINE)
                .action(approvalAction.returnToDraft())
                .and()

            // IN_PROGRESS -> RECALLED
            .withExternal()
                .source(ApprovalStatus.IN_PROGRESS)
                .target(ApprovalStatus.RECALLED)
                .event(ApprovalEvent.RECALL)
                .and()

            // PENDING -> RECALLED
            .withExternal()
                .source(ApprovalStatus.PENDING)
                .target(ApprovalStatus.RECALLED)
                .event(ApprovalEvent.RECALL)
                .and()

            // PENDING -> CANCELED
            .withExternal()
                .source(ApprovalStatus.PENDING)
                .target(ApprovalStatus.CANCELED)
                .event(ApprovalEvent.CANCEL);
    }
}
