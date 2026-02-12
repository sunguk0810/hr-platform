package com.hrsaas.employee.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.service.CondolenceService;
import com.hrsaas.employee.service.EmployeeChangeRequestService;
import com.hrsaas.employee.service.EmployeeService;
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

    private final CondolenceService condolenceService;
    private final EmployeeChangeRequestService changeRequestService;
    private final EmployeeService employeeService;

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
                if ("APPROVED".equals(status)) {
                    condolenceService.approveByApproval(referenceId);
                } else if ("REJECTED".equals(status)) {
                    String reason = event.has("reason") ? event.get("reason").asText() : "";
                    condolenceService.rejectByApproval(referenceId, reason);
                }
            }
            case "EMPLOYEE_CHANGE" -> {
                log.info("Processing employee change approval: referenceId={}, status={}", referenceId, status);
                UUID actionBy = event.has("approvedBy")
                    ? UUID.fromString(event.get("approvedBy").asText())
                    : null;
                String rejectionReason = event.has("reason")
                    ? event.get("reason").asText()
                    : null;
                changeRequestService.handleApprovalCompleted(
                    referenceId, "APPROVED".equals(status), actionBy, rejectionReason);
            }
            default -> log.debug("Ignoring document type: {}", documentType);
        }
    }

    private void handleAppointmentExecuted(JsonNode event) {
        log.info("Processing appointment execution event");
        String effectiveDateStr = event.get("effectiveDate").asText();

        JsonNode details = event.get("details");
        if (details != null && details.isArray()) {
            java.util.List<UUID> resignationIds = new java.util.ArrayList<>();
            java.util.List<UUID> suspendIds = new java.util.ArrayList<>();
            java.util.List<UUID> activateIds = new java.util.ArrayList<>();
            java.util.List<UpdateEmployeeRequest> updateRequests = new java.util.ArrayList<>();

            for (JsonNode detail : details) {
                try {
                    UUID employeeId = UUID.fromString(detail.get("employeeId").asText());
                    String appointmentType = detail.get("appointmentType").asText();

                    switch (appointmentType) {
                        case "RESIGNATION", "RETIREMENT" -> resignationIds.add(employeeId);
                        case "LEAVE_OF_ABSENCE" -> suspendIds.add(employeeId);
                        case "REINSTATEMENT" -> activateIds.add(employeeId);
                        case "PROMOTION", "TRANSFER", "POSITION_CHANGE", "JOB_CHANGE", "DEMOTION" -> {
                            UpdateEmployeeRequest request = new UpdateEmployeeRequest();
                            request.setEmployeeId(employeeId);

                            if (detail.has("toDepartmentId") && !detail.get("toDepartmentId").isNull()) {
                                request.setDepartmentId(UUID.fromString(detail.get("toDepartmentId").asText()));
                            }
                            if (detail.has("toPositionCode") && !detail.get("toPositionCode").isNull()) {
                                request.setPositionCode(detail.get("toPositionCode").asText());
                            }
                            if (detail.has("toGradeCode") && !detail.get("toGradeCode").isNull()) {
                                request.setJobTitleCode(detail.get("toGradeCode").asText());
                            }

                            if (request.getDepartmentId() != null || request.getPositionCode() != null || request.getJobTitleCode() != null) {
                                updateRequests.add(request);
                            }
                        }
                        default -> log.warn("Unsupported appointment type: {}", appointmentType);
                    }
                } catch (Exception e) {
                    log.error("Failed to parse appointment detail: {}", detail, e);
                }
            }

            // Execute bulk operations
            if (!resignationIds.isEmpty()) {
                employeeService.bulkResign(resignationIds, effectiveDateStr);
            }
            if (!suspendIds.isEmpty()) {
                employeeService.bulkSuspend(suspendIds);
            }
            if (!activateIds.isEmpty()) {
                employeeService.bulkActivate(activateIds);
            }
            if (!updateRequests.isEmpty()) {
                employeeService.bulkUpdate(updateRequests);
            }
        }
    }
}
