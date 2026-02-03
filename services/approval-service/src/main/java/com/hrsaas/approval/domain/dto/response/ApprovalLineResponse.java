package com.hrsaas.approval.domain.dto.response;

import com.hrsaas.approval.domain.entity.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineResponse {

    private UUID id;
    private Integer sequence;
    private ApprovalLineType lineType;
    private UUID approverId;
    private String approverName;
    private String approverPosition;
    private String approverDepartmentName;
    private UUID delegateId;
    private String delegateName;
    private ApprovalLineStatus status;
    private ApprovalActionType actionType;
    private String comment;
    private Instant activatedAt;
    private Instant completedAt;

    public static ApprovalLineResponse from(ApprovalLine line) {
        return ApprovalLineResponse.builder()
            .id(line.getId())
            .sequence(line.getSequence())
            .lineType(line.getLineType())
            .approverId(line.getApproverId())
            .approverName(line.getApproverName())
            .approverPosition(line.getApproverPosition())
            .approverDepartmentName(line.getApproverDepartmentName())
            .delegateId(line.getDelegateId())
            .delegateName(line.getDelegateName())
            .status(line.getStatus())
            .actionType(line.getActionType())
            .comment(line.getComment())
            .activatedAt(line.getActivatedAt())
            .completedAt(line.getCompletedAt())
            .build();
    }
}
