package com.hrsaas.approval.domain.event;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class ApprovalSubmittedEvent extends DomainEvent {

    private final UUID documentId;
    private final String documentNumber;
    private final String title;
    private final String documentType;
    private final UUID drafterId;
    private final String drafterName;
    private final UUID currentApproverId;
    private final String currentApproverName;

    public static ApprovalSubmittedEvent of(ApprovalDocument document) {
        var currentLine = document.getApprovalLines().stream()
            .filter(l -> l.getStatus().name().equals("ACTIVE"))
            .findFirst()
            .orElse(null);

        return ApprovalSubmittedEvent.builder()
            .documentId(document.getId())
            .documentNumber(document.getDocumentNumber())
            .title(document.getTitle())
            .documentType(document.getDocumentType())
            .drafterId(document.getDrafterId())
            .drafterName(document.getDrafterName())
            .currentApproverId(currentLine != null ? currentLine.getApproverId() : null)
            .currentApproverName(currentLine != null ? currentLine.getApproverName() : null)
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.APPROVAL_SUBMITTED;
    }
}
