package com.hrsaas.approval.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결재 요약 정보 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalSummaryResponse {

    private long pending;
    private long approved;
    private long rejected;
    private long draft;
}
