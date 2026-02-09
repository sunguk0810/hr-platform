package com.hrsaas.employee.domain.dto.response;

import com.hrsaas.employee.domain.entity.CardIssueRequest;
import com.hrsaas.employee.domain.entity.CardIssueRequestStatus;
import com.hrsaas.employee.domain.entity.CardIssueType;
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
public class CardIssueRequestResponse {

    private UUID id;
    private String requestNumber;
    private UUID employeeId;
    private CardIssueType issueType;
    private String reason;
    private CardIssueRequestStatus status;
    private UUID approvedBy;
    private Instant approvedAt;
    private String rejectionReason;
    private UUID issuedCardId;
    private Instant createdAt;

    public static CardIssueRequestResponse from(CardIssueRequest request) {
        return CardIssueRequestResponse.builder()
            .id(request.getId())
            .requestNumber(request.getRequestNumber())
            .employeeId(request.getEmployeeId())
            .issueType(request.getIssueType())
            .reason(request.getReason())
            .status(request.getStatus())
            .approvedBy(request.getApprovedBy())
            .approvedAt(request.getApprovedAt())
            .rejectionReason(request.getRejectionReason())
            .issuedCardId(request.getIssuedCardId())
            .createdAt(request.getCreatedAt())
            .build();
    }
}
