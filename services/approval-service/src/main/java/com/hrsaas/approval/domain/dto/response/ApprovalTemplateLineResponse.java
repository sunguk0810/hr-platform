package com.hrsaas.approval.domain.dto.response;

import com.hrsaas.approval.domain.entity.ApprovalLineType;
import com.hrsaas.approval.domain.entity.ApprovalTemplateLine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateLineResponse {

    private UUID id;
    private Integer sequence;
    private ApprovalLineType lineType;
    private String approverType;
    private UUID approverId;
    private String approverName;
    private String positionCode;
    private UUID departmentId;
    private String description;

    public static ApprovalTemplateLineResponse from(ApprovalTemplateLine line) {
        return ApprovalTemplateLineResponse.builder()
            .id(line.getId())
            .sequence(line.getSequence())
            .lineType(line.getLineType())
            .approverType(line.getApproverType())
            .approverId(line.getApproverId())
            .approverName(line.getApproverName())
            .positionCode(line.getPositionCode())
            .departmentId(line.getDepartmentId())
            .description(line.getDescription())
            .build();
    }
}
