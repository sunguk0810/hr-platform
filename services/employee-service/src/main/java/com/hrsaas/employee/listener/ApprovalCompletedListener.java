package com.hrsaas.employee.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SQS listener for approval-completed and appointment-executed events targeting employee service.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    @SqsListener("employee-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            switch (eventType) {
                case "ApprovalCompletedEvent" -> handleApprovalCompleted(event);
                case "AppointmentExecutedEvent" -> handleAppointmentExecuted(event);
                default -> log.debug("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw e;
        }
    }

    private void handleApprovalCompleted(JsonNode event) {
        String documentType = event.get("documentType").asText();
        UUID referenceId = UUID.fromString(event.get("referenceId").asText());
        String status = event.get("status").asText();

        switch (documentType) {
            case "CONDOLENCE" -> {
                log.info("Processing condolence approval: referenceId={}, status={}", referenceId, status);
                // TODO: Update condolence request status
            }
            case "EMPLOYEE_CHANGE" -> {
                log.info("Processing employee change approval: referenceId={}, status={}", referenceId, status);
                // TODO: Apply employee field changes when approved
            }
            default -> log.debug("Ignoring document type: {}", documentType);
        }
    }

    private void handleAppointmentExecuted(JsonNode event) {
        log.info("Processing appointment execution event");
        // TODO: Update employee department/position based on appointment
    }
}
