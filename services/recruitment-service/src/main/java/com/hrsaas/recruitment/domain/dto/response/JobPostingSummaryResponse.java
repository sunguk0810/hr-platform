package com.hrsaas.recruitment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 채용공고 요약 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPostingSummaryResponse {

    private long total;
    private long draft;
    private long pending;
    private long published;
    private long closed;
    private long cancelled;
    private long completed;
}
