package com.hrsaas.recruitment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 면접 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewSummaryResponse {

    private long total;
    private long scheduling;
    private long scheduled;
    private long inProgress;
    private long completed;
    private long noShow;
    private long cancelled;
    private long postponed;
}
