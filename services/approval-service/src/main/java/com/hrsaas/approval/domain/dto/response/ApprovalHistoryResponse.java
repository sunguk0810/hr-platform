package com.hrsaas.approval.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * 결재 이력 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalHistoryResponse {

    private UUID id;
    private UUID documentId;
    private int stepOrder;
    private String action;
    private UUID actorId;
    private String actorName;
    private String actorDepartment;
    private String comment;
    private Instant processedAt;
}
