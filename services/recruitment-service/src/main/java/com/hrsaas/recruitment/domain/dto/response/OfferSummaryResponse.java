package com.hrsaas.recruitment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채용 제안 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferSummaryResponse {

    private long total;
    private long draft;
    private long pendingApproval;
    private long approved;
    private long sent;
    private long accepted;
    private long declined;
    private long negotiating;
    private long expired;
    private long cancelled;
}
