package com.hrsaas.organization.domain.dto.response;

import com.hrsaas.organization.domain.entity.HeadcountRequest;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import com.hrsaas.organization.domain.entity.HeadcountRequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeadcountRequestResponse {

    private UUID id;
    private UUID departmentId;
    private String departmentName;
    private HeadcountRequestType type;
    private Integer requestCount;
    private UUID gradeId;
    private String gradeName;
    private UUID positionId;
    private String positionName;
    private String reason;
    private LocalDate effectiveDate;
    private HeadcountRequestStatus status;
    private UUID approvalId;
    private UUID requesterId;
    private String requesterName;
    private Instant createdAt;
    private Instant updatedAt;

    public static HeadcountRequestResponse from(HeadcountRequest request) {
        return HeadcountRequestResponse.builder()
            .id(request.getId())
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .type(request.getType())
            .requestCount(request.getRequestCount())
            .gradeId(request.getGradeId())
            .gradeName(request.getGradeName())
            .positionId(request.getPositionId())
            .positionName(request.getPositionName())
            .reason(request.getReason())
            .effectiveDate(request.getEffectiveDate())
            .status(request.getStatus())
            .approvalId(request.getApprovalId())
            .requesterId(request.getRequesterId())
            .requesterName(request.getRequesterName())
            .createdAt(request.getCreatedAt())
            .updatedAt(request.getUpdatedAt())
            .build();
    }
}
