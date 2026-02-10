package com.hrsaas.approval.domain.dto.response;

import com.hrsaas.approval.domain.entity.ApprovalDocument;
import com.hrsaas.approval.domain.entity.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDocumentResponse {

    private UUID id;
    private String documentNumber;
    private String title;
    private String content;
    private String documentType;
    private ApprovalStatus status;
    private UUID drafterId;
    private String drafterName;
    private UUID drafterDepartmentId;
    private String drafterDepartmentName;
    private String referenceType;
    private UUID referenceId;
    private Instant submittedAt;
    private Instant completedAt;
    private Instant deadlineAt;
    private Boolean escalated;
    private Integer returnCount;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ApprovalLineResponse> approvalLines;

    public static ApprovalDocumentResponse from(ApprovalDocument document) {
        return ApprovalDocumentResponse.builder()
            .id(document.getId())
            .documentNumber(document.getDocumentNumber())
            .title(document.getTitle())
            .content(document.getContent())
            .documentType(document.getDocumentType())
            .status(document.getStatus())
            .drafterId(document.getDrafterId())
            .drafterName(document.getDrafterName())
            .drafterDepartmentId(document.getDrafterDepartmentId())
            .drafterDepartmentName(document.getDrafterDepartmentName())
            .referenceType(document.getReferenceType())
            .referenceId(document.getReferenceId())
            .submittedAt(document.getSubmittedAt())
            .completedAt(document.getCompletedAt())
            .deadlineAt(document.getDeadlineAt())
            .escalated(document.getEscalated())
            .returnCount(document.getReturnCount())
            .createdAt(document.getCreatedAt())
            .updatedAt(document.getUpdatedAt())
            .approvalLines(document.getApprovalLines().stream()
                .map(ApprovalLineResponse::from)
                .toList())
            .build();
    }
}
