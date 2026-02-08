package com.hrsaas.organization.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.organization.service.HeadcountService;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    private final HeadcountService headcountService;
    private final ObjectMapper objectMapper;

    @SqsListener("organization-approval-completed-queue")
    public void onApprovalCompleted(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String referenceType = node.path("referenceType").asText();

            if (!"HEADCOUNT_REQUEST".equals(referenceType)) {
                return;
            }

            UUID referenceId = UUID.fromString(node.path("referenceId").asText());
            String status = node.path("status").asText();
            String reason = node.path("reason").asText("");

            if ("APPROVED".equals(status)) {
                headcountService.approveRequest(referenceId);
                log.info("Headcount request approved via approval workflow: {}", referenceId);
            } else if ("REJECTED".equals(status)) {
                headcountService.rejectRequest(referenceId, reason);
                log.info("Headcount request rejected via approval workflow: {}", referenceId);
            }
        } catch (Exception e) {
            log.error("Failed to process approval completed event: {}", e.getMessage(), e);
        }
    }
}
