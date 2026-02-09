package com.hrsaas.attendance.listener;

import com.hrsaas.attendance.service.LeaveAccrualService;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.attendance.service.OvertimeService;
import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.common.tenant.TenantContext;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

/**
 * SQS listener for events targeting attendance service.
 * Handles approval-completed events and employee-created events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ApprovalCompletedListener {

    private final LeaveService leaveService;
    private final OvertimeService overtimeService;
    private final LeaveAccrualService accrualService;

    @SqsListener("attendance-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            // SNS wraps the message in an envelope
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            switch (eventType) {
                case "ApprovalCompletedEvent" -> handleApprovalCompleted(event);
                case "EmployeeCreatedEvent" -> handleEmployeeCreated(event);
                default -> log.debug("Ignoring unknown event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw e; // re-throw for retry/DLQ
        }
    }

    private void handleApprovalCompleted(JsonNode event) {
        String documentType = event.get("documentType").asText();
        UUID referenceId = UUID.fromString(event.get("referenceId").asText());
        String status = event.get("status").asText();

        switch (documentType) {
            case "LEAVE_REQUEST" -> {
                boolean approved = "APPROVED".equals(status);
                log.info("Processing leave approval: referenceId={}, approved={}", referenceId, approved);
                leaveService.handleApprovalCompleted(referenceId, approved);
            }
            case "OVERTIME_REQUEST" -> {
                log.info("Processing overtime approval: referenceId={}, status={}", referenceId, status);
                if ("APPROVED".equals(status)) {
                    overtimeService.approve(referenceId);
                } else {
                    String reason = event.has("reason") ? event.get("reason").asText() : "결재 반려";
                    overtimeService.reject(referenceId, reason);
                }
            }
            default -> log.debug("Ignoring approval for document type: {}", documentType);
        }
    }

    private void handleEmployeeCreated(JsonNode event) {
        try {
            UUID tenantId = UUID.fromString(event.get("tenantId").asText());
            UUID employeeId = UUID.fromString(event.get("employeeId").asText());
            String hireDateStr = event.has("hireDate") ? event.get("hireDate").asText() : null;

            if (hireDateStr == null) {
                log.warn("EmployeeCreatedEvent missing hireDate: employeeId={}", employeeId);
                return;
            }

            LocalDate hireDate = LocalDate.parse(hireDateStr);
            int year = LocalDate.now().getYear();

            TenantContext.setCurrentTenant(tenantId);
            accrualService.generateForEmployee(employeeId, hireDate, year);
            log.info("Initial leave balance created for new employee: employeeId={}, hireDate={}", employeeId, hireDate);
        } catch (Exception e) {
            log.error("Failed to process EmployeeCreatedEvent", e);
        } finally {
            TenantContext.clear();
        }
    }
}
