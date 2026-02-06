package com.hrsaas.organization.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * SQS listener for employee affiliation changed events targeting organization service.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AffiliationChangedListener {

    @SqsListener("organization-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            if ("EmployeeAffiliationChangedEvent".equals(eventType)) {
                handleAffiliationChanged(event);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw e;
        }
    }

    private void handleAffiliationChanged(JsonNode event) {
        log.info("Processing affiliation change event: {}", event);
        // TODO: Update committee members for ex-officio positions
    }
}
