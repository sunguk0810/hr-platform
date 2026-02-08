package com.hrsaas.recruitment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 지원서 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationSummaryResponse {

    private long total;
    private long submitted;
    private long screening;
    private long screened;
    private long interviewing;
    private long interviewPassed;
    private long offerPending;
    private long hired;
    private long rejected;
    private long withdrawn;
}
