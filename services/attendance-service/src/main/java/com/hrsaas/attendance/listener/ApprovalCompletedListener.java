package com.hrsaas.attendance.listener;

import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.common.core.util.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SQS listener for approval-completed events targeting attendance service.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    private final LeaveService leaveService;

    @SqsListener("attendance-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            // SNS wraps the message in an envelope
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            if ("ApprovalCompletedEvent".equals(eventType)) {
                handleApprovalCompleted(event);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw e; // re-throw for retry/DLQ
        }
    }

    private void handleApprovalCompleted(JsonNode event) {
        String documentType = event.get("documentType").asText();
        if (!"LEAVE_REQUEST".equals(documentType)) {
            log.debug("Ignoring non-leave approval: documentType={}", documentType);
            return;
        }

        UUID referenceId = UUID.fromString(event.get("referenceId").asText());
        String status = event.get("status").asText();
        boolean approved = "APPROVED".equals(status);

        log.info("Processing leave approval: referenceId={}, approved={}", referenceId, approved);
        leaveService.handleApprovalCompleted(referenceId, approved);
    }
}
