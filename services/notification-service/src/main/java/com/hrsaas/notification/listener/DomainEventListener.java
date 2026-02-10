package com.hrsaas.notification.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.notification.domain.dto.request.SendNotificationRequest;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationPreference;
import com.hrsaas.notification.domain.entity.NotificationType;
import com.hrsaas.notification.repository.NotificationPreferenceRepository;
import com.hrsaas.notification.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * SQS listener for domain events targeting notification service.
 * Receives approval-submitted, leave-requested, employee-created,
 * and approval-completed events.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DomainEventListener {

    private final NotificationService notificationService;
    private final NotificationPreferenceRepository preferenceRepository;

    @SqsListener("notification-service-queue")
    public void handleMessage(String rawMessage) {
        try {
            JsonNode envelope = JsonUtils.toJsonNode(rawMessage);
            String message = envelope.has("Message") ? envelope.get("Message").asText() : rawMessage;
            JsonNode event = JsonUtils.toJsonNode(message);

            String eventType = event.has("eventType") ? event.get("eventType").asText() : "";

            switch (eventType) {
                case "ApprovalSubmittedEvent" -> handleApprovalSubmitted(event);
                case "ApprovalCompletedEvent" -> handleApprovalCompleted(event);
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

        UUID tenantId = getUUID(event, "tenantId");
        UUID documentId = getUUID(event, "documentId");
        String title = getText(event, "title", "결재 요청");
        String documentNumber = getText(event, "documentNumber", "");
        String drafterName = getText(event, "drafterName", "");

        if (isOptedOut(tenantId, currentApproverId, NotificationType.APPROVAL_REQUESTED)) {
            log.info("Approval notification opted out: approverId={}", currentApproverId);
            return;
        }

        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientId(currentApproverId)
                .notificationType(NotificationType.APPROVAL_REQUESTED)
                .channels(List.of(NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL))
                .title("[결재요청] " + title)
                .content(String.format("%s님이 결재를 요청했습니다. (문서번호: %s)", drafterName, documentNumber))
                .linkUrl("/approvals/" + documentId)
                .referenceType("APPROVAL")
                .referenceId(documentId)
                .build();

        notificationService.send(request);
        log.info("Approval submitted notification sent: approverId={}, documentNumber={}", currentApproverId, documentNumber);
    }

    private void handleApprovalCompleted(JsonNode event) {
        UUID drafterId = getUUID(event, "drafterId");
        if (drafterId == null) return;

        UUID tenantId = getUUID(event, "tenantId");
        UUID documentId = getUUID(event, "documentId");
        String title = getText(event, "title", "결재 완료");
        String documentNumber = getText(event, "documentNumber", "");
        String finalStatus = getText(event, "finalStatus", "APPROVED");

        NotificationType notificationType = "REJECTED".equals(finalStatus)
                ? NotificationType.APPROVAL_REJECTED
                : NotificationType.APPROVAL_APPROVED;

        if (isOptedOut(tenantId, drafterId, notificationType)) {
            log.info("Approval completion notification opted out: drafterId={}", drafterId);
            return;
        }

        String statusText = "REJECTED".equals(finalStatus) ? "반려" : "승인";

        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientId(drafterId)
                .notificationType(notificationType)
                .channels(List.of(NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL))
                .title(String.format("[결재%s] %s", statusText, title))
                .content(String.format("결재가 %s되었습니다. (문서번호: %s)", statusText, documentNumber))
                .linkUrl("/approvals/" + documentId)
                .referenceType("APPROVAL")
                .referenceId(documentId)
                .build();

        notificationService.send(request);
        log.info("Approval completed notification sent: drafterId={}, status={}", drafterId, finalStatus);
    }

    private void handleLeaveRequested(JsonNode event) {
        UUID employeeId = getUUID(event, "employeeId");
        if (employeeId == null) return;

        UUID tenantId = getUUID(event, "tenantId");
        UUID leaveRequestId = getUUID(event, "leaveRequestId");
        String employeeName = getText(event, "employeeName", "");
        String leaveType = getText(event, "leaveType", "");
        String startDate = getText(event, "startDate", "");
        String endDate = getText(event, "endDate", "");
        String departmentName = getText(event, "departmentName", "");

        // Notify the employee that the leave request was submitted
        if (!isOptedOut(tenantId, employeeId, NotificationType.LEAVE_REQUESTED)) {
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .recipientId(employeeId)
                    .notificationType(NotificationType.LEAVE_REQUESTED)
                    .channels(List.of(NotificationChannel.WEB_PUSH))
                    .title("[휴가신청] 휴가 신청이 접수되었습니다")
                    .content(String.format("%s 휴가가 신청되었습니다. (%s ~ %s)", leaveType, startDate, endDate))
                    .linkUrl("/attendance/leaves/" + leaveRequestId)
                    .referenceType("LEAVE_REQUEST")
                    .referenceId(leaveRequestId)
                    .build();

            notificationService.send(request);
            log.info("Leave request notification sent: employeeId={}, type={}", employeeId, leaveType);
        }
    }

    private void handleEmployeeCreated(JsonNode event) {
        UUID employeeId = getUUID(event, "employeeId");
        if (employeeId == null) return;

        String name = getText(event, "name", "");
        String employeeNumber = getText(event, "employeeNumber", "");

        SendNotificationRequest request = SendNotificationRequest.builder()
                .recipientId(employeeId)
                .notificationType(NotificationType.EMPLOYEE_JOINED)
                .channels(List.of(NotificationChannel.WEB_PUSH, NotificationChannel.EMAIL))
                .title("[입사환영] 환영합니다!")
                .content(String.format("%s님, HR SaaS 플랫폼에 오신 것을 환영합니다. (사번: %s)", name, employeeNumber))
                .linkUrl("/my/profile")
                .referenceType("EMPLOYEE")
                .referenceId(employeeId)
                .build();

        notificationService.send(request);
        log.info("Welcome notification sent: employeeId={}, name={}", employeeId, name);
    }

    /**
     * Check if user has opted out of a specific notification type.
     * Returns false (not opted out) if no preference exists or tenantId is null.
     */
    private boolean isOptedOut(UUID tenantId, UUID userId, NotificationType type) {
        if (tenantId == null || userId == null) return false;
        try {
            List<NotificationPreference> prefs = preferenceRepository.findByTenantIdAndUserId(tenantId, userId);
            return prefs.stream()
                    .filter(p -> p.getNotificationType() == type)
                    .anyMatch(p -> Boolean.FALSE.equals(p.getEnabled()));
        } catch (Exception e) {
            log.warn("Failed to check notification preference: userId={}, type={}", userId, type, e);
            return false;
        }
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

    private String getText(JsonNode node, String field, String defaultValue) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : defaultValue;
    }
}
