package com.hrsaas.appointment.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SQS listener for approval-completed events targeting appointment service.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    // TODO: Inject AppointmentDraftService when approval->appointment flow is connected

    @SqsListener("appointment-service-queue")
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
        String documentType = event.get("documentType").asText();
        if (!"APPOINTMENT".equals(documentType)) {
            return;
        }

        UUID referenceId = UUID.fromString(event.get("referenceId").asText());
        String status = event.get("status").asText();

        log.info("Processing appointment approval: referenceId={}, status={}", referenceId, status);
        // TODO: Execute appointment when approved
        // appointmentDraftService.handleApprovalCompleted(referenceId, "APPROVED".equals(status));
    }
}
