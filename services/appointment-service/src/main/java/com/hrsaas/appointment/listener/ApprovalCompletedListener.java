package com.hrsaas.appointment.listener;

import com.hrsaas.appointment.domain.entity.AppointmentDraft;
import com.hrsaas.appointment.domain.entity.DraftStatus;
import com.hrsaas.appointment.repository.AppointmentDraftRepository;
import com.hrsaas.common.core.util.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * SQS listener for approval-completed events targeting appointment service.
 * When approval is completed (approved/rejected), updates the appointment draft status.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    private final AppointmentDraftRepository draftRepository;

    @SqsListener("appointment-service-queue")
    @Transactional
    public void handleMessage(String rawMessage) {
        try {
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            if ("ApprovalCompletedEvent".equals(eventType)) {
                handleApprovalCompleted(event);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw e;
        }
    }

    private void handleApprovalCompleted(JsonNode event) {
        String documentType = event.has("documentType") ? event.get("documentType").asText() : "";
        if (!"APPOINTMENT".equals(documentType)) {
            return;
        }

        String referenceIdStr = event.has("referenceId") && !event.get("referenceId").isNull()
                ? event.get("referenceId").asText() : null;
        if (referenceIdStr == null) return;

        UUID referenceId = UUID.fromString(referenceIdStr);
        String status = event.has("status") ? event.get("status").asText() : "";

        log.info("Processing appointment approval: referenceId={}, status={}", referenceId, status);

        AppointmentDraft draft = draftRepository.findById(referenceId).orElse(null);
        if (draft == null) {
            log.warn("Appointment draft not found for referenceId: {}", referenceId);
            return;
        }

        if (draft.getStatus() != DraftStatus.PENDING_APPROVAL) {
            log.warn("Appointment draft not in PENDING_APPROVAL state: id={}, status={}", referenceId, draft.getStatus());
            return;
        }

        if ("APPROVED".equals(status)) {
            UUID approverId = null;
            if (event.has("actorId") && !event.get("actorId").isNull()) {
                try { approverId = UUID.fromString(event.get("actorId").asText()); } catch (Exception ignored) {}
            }
            draft.approve(approverId);
            draftRepository.save(draft);
            log.info("Appointment draft approved: id={}", referenceId);
        } else if ("REJECTED".equals(status)) {
            draft.reject();
            draftRepository.save(draft);
            log.info("Appointment draft rejected: id={}", referenceId);
        }
    }
}
