package com.hrsaas.approval.service;

import com.hrsaas.approval.client.EmployeeClient;
import com.hrsaas.approval.client.OrganizationClient;
import com.hrsaas.approval.domain.entity.ApprovalLine;
import com.hrsaas.approval.domain.entity.ApprovalLineType;
import com.hrsaas.approval.domain.entity.ApprovalTemplate;
import com.hrsaas.approval.domain.entity.ApprovalTemplateLine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalLineResolver {

    private final OrganizationClient organizationClient;
    private final EmployeeClient employeeClient;

    /**
     * 템플릿 기반으로 실제 결재선 생성
     */
    public List<ApprovalLine> resolveTemplateLines(ApprovalTemplate template, UUID drafterId, UUID drafterDepartmentId) {
        List<ApprovalLine> resolvedLines = new ArrayList<>();

        for (ApprovalTemplateLine templateLine : template.getTemplateLines()) {
            ApprovalLine line = resolveTemplateLine(templateLine, drafterId, drafterDepartmentId);
            if (line != null) {
                resolvedLines.add(line);
            }
        }

        return resolvedLines;
    }

    private ApprovalLine resolveTemplateLine(ApprovalTemplateLine templateLine, UUID drafterId, UUID drafterDepartmentId) {
        return switch (templateLine.getApproverType()) {
            case "SPECIFIC_USER" -> ApprovalLine.builder()
                .sequence(templateLine.getSequence())
                .lineType(templateLine.getLineType())
                .approverId(templateLine.getApproverId())
                .approverName(templateLine.getApproverName())
                .build();

            case "DEPARTMENT_HEAD" -> {
                UUID departmentId = templateLine.getDepartmentId() != null ?
                    templateLine.getDepartmentId() : drafterDepartmentId;
                try {
                    var head = organizationClient.getDepartmentHead(departmentId);
                    if (head != null) {
                        yield ApprovalLine.builder()
                            .sequence(templateLine.getSequence())
                            .lineType(templateLine.getLineType())
                            .approverId(head.getEmployeeId())
                            .approverName(head.getEmployeeName())
                            .approverPosition(head.getPositionName())
                            .approverDepartmentName(head.getDepartmentName())
                            .build();
                    }
                } catch (Exception e) {
                    log.warn("Failed to resolve DEPARTMENT_HEAD: departmentId={}", departmentId, e);
                }
                yield null;
            }

            case "DRAFTER_MANAGER" -> {
                try {
                    var manager = employeeClient.getManager(drafterId);
                    if (manager != null) {
                        yield ApprovalLine.builder()
                            .sequence(templateLine.getSequence())
                            .lineType(templateLine.getLineType())
                            .approverId(manager.getId())
                            .approverName(manager.getName())
                            .approverPosition(manager.getPositionCode())
                            .approverDepartmentName(manager.getDepartmentName())
                            .build();
                    }
                } catch (Exception e) {
                    log.warn("Failed to resolve DRAFTER_MANAGER: drafterId={}", drafterId, e);
                }
                yield null;
            }

            case "POSITION_HOLDER" -> {
                try {
                    var holder = organizationClient.getPositionHolder(
                        templateLine.getPositionCode(),
                        templateLine.getDepartmentId() != null ? templateLine.getDepartmentId() : drafterDepartmentId);
                    if (holder != null) {
                        yield ApprovalLine.builder()
                            .sequence(templateLine.getSequence())
                            .lineType(templateLine.getLineType())
                            .approverId(holder.getEmployeeId())
                            .approverName(holder.getEmployeeName())
                            .approverPosition(holder.getPositionName())
                            .approverDepartmentName(holder.getDepartmentName())
                            .build();
                    }
                } catch (Exception e) {
                    log.warn("Failed to resolve POSITION_HOLDER: positionCode={}", templateLine.getPositionCode(), e);
                }
                yield null;
            }

            default -> {
                log.warn("Unknown approver type: {}", templateLine.getApproverType());
                yield null;
            }
        };
    }
}
