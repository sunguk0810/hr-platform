package com.hrsaas.notification.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.notification.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SQS listener for domain events targeting notification service.
 * Receives approval-submitted, leave-requested, and employee-created events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DomainEventListener {

    private final NotificationService notificationService;

    @SqsListener("notification-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            switch (eventType) {
                case "ApprovalSubmittedEvent" -> handleApprovalSubmitted(event);
                case "LeaveRequestCreatedEvent" -> handleLeaveRequested(event);
                case "EmployeeCreatedEvent" -> handleEmployeeCreated(event);
                default -> log.debug("Ignoring event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process notification SQS message", e);
            throw e;
        }
    }

    private void handleApprovalSubmitted(JsonNode event) {
        UUID currentApproverId = getUUID(event, "currentApproverId");
        if (currentApproverId == null) return;

        String title = event.has("title") ? event.get("title").asText() : "결재 요청";
        String documentNumber = event.has("documentNumber") ? event.get("documentNumber").asText() : "";

        log.info("Sending approval notification to approver: {}", currentApproverId);
        // Notification creation via service
    }

    private void handleLeaveRequested(JsonNode event) {
        log.info("Processing leave request notification");
        // TODO: Notify manager about leave request
    }

    private void handleEmployeeCreated(JsonNode event) {
        log.info("Processing employee created notification");
        // TODO: Welcome notification to new employee
    }

    private UUID getUUID(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            try {
                return UUID.fromString(node.get(field).asText());
            } catch (IllegalArgumentException e) {
                return null;
            }
        }
        return null;
    }
}
