package com.hrsaas.organization.listener;

import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.organization.domain.entity.CommitteeMember;
import com.hrsaas.organization.repository.CommitteeMemberRepository;
import com.fasterxml.jackson.databind.JsonNode;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * SQS listener for employee affiliation changed events targeting organization service.
 * When an employee's department or position changes, updates their active committee memberships.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AffiliationChangedListener {

    private final CommitteeMemberRepository committeeMemberRepository;

    @SqsListener("organization-service-queue")
    @Transactional
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
        String employeeIdStr = getText(event, "employeeId", null);
        if (employeeIdStr == null) {
            log.warn("Missing employeeId in affiliation change event");
            return;
        }

        UUID employeeId = UUID.fromString(employeeIdStr);
        String newDepartmentName = getText(event, "toDepartmentName", null);
        String newPositionName = getText(event, "toPositionName", null);
        String employeeName = getText(event, "employeeName", null);

        log.info("Processing affiliation change: employeeId={}, newDept={}, newPos={}",
                employeeId, newDepartmentName, newPositionName);

        // Update all active committee memberships for this employee
        List<CommitteeMember> activeMembers = committeeMemberRepository.findActiveByEmployeeId(employeeId);

        if (activeMembers.isEmpty()) {
            log.debug("No active committee memberships found for employee: {}", employeeId);
            return;
        }

        int updated = 0;
        for (CommitteeMember member : activeMembers) {
            boolean changed = false;

            if (newDepartmentName != null && !newDepartmentName.equals(member.getDepartmentName())) {
                member.setDepartmentName(newDepartmentName);
                changed = true;
            }

            if (newPositionName != null && !newPositionName.equals(member.getPositionName())) {
                member.setPositionName(newPositionName);
                changed = true;
            }

            if (employeeName != null && !employeeName.equals(member.getEmployeeName())) {
                member.setEmployeeName(employeeName);
                changed = true;
            }

            if (changed) {
                committeeMemberRepository.save(member);
                updated++;
            }
        }

        log.info("Updated {} committee memberships for employee: {}", updated, employeeId);
    }

    private String getText(JsonNode node, String field, String defaultValue) {
        if (node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return defaultValue;
    }
}
