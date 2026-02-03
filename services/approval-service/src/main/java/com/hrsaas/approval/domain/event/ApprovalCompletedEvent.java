package com.hrsaas.approval.domain.event;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalStatus;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Getter
@SuperBuilder
public class ApprovalCompletedEvent extends DomainEvent {

    private final UUID documentId;
    private final String documentNumber;
    private final String title;
    private final String documentType;
    private final ApprovalStatus status;
    private final UUID drafterId;
    private final String drafterName;
    private final String referenceType;
    private final UUID referenceId;

    public static ApprovalCompletedEvent of(ApprovalDocument document) {
        return ApprovalCompletedEvent.builder()
            .documentId(document.getId())
            .documentNumber(document.getDocumentNumber())
            .title(document.getTitle())
            .documentType(document.getDocumentType())
            .status(document.getStatus())
            .drafterId(document.getDrafterId())
            .drafterName(document.getDrafterName())
            .referenceType(document.getReferenceType())
            .referenceId(document.getReferenceId())
            .build();
    }

    @Override
    public String getTopic() {
        return EventTopics.APPROVAL_COMPLETED;
    }
}
