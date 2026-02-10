package com.hrsaas.recruitment.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.recruitment.domain.entity.Offer;
import com.hrsaas.recruitment.domain.entity.OfferStatus;
import com.hrsaas.recruitment.repository.OfferRepository;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * SQS listener for approval-completed events targeting recruitment offers.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    private final OfferRepository offerRepository;

    @SqsListener("recruitment-service-queue")
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
        if (!"OFFER".equals(documentType) && !"RECRUITMENT_OFFER".equals(documentType)) {
            return;
        }

        String referenceIdStr = event.has("referenceId") && !event.get("referenceId").isNull()
                ? event.get("referenceId").asText() : null;
        if (referenceIdStr == null) return;

        UUID referenceId = UUID.fromString(referenceIdStr);
        String status = event.has("status") ? event.get("status").asText() : "";

        log.info("Processing offer approval: referenceId={}, status={}", referenceId, status);

        Offer offer = offerRepository.findById(referenceId).orElse(null);
        if (offer == null) {
            log.warn("Offer not found for referenceId: {}", referenceId);
            return;
        }

        if (offer.getStatus() != OfferStatus.PENDING_APPROVAL) {
            log.warn("Offer not in PENDING_APPROVAL state: id={}, status={}", referenceId, offer.getStatus());
            return;
        }

        if ("APPROVED".equals(status)) {
            UUID approverId = null;
            if (event.has("actorId") && !event.get("actorId").isNull()) {
                try { approverId = UUID.fromString(event.get("actorId").asText()); } catch (Exception ignored) {}
            }
            offer.approve(approverId);
            offerRepository.save(offer);
            log.info("Offer approved: id={}", referenceId);
        } else if ("REJECTED".equals(status)) {
            offer.cancel();
            offerRepository.save(offer);
            log.info("Offer rejected and cancelled: id={}", referenceId);
        }
    }
}
