package com.hrsaas.recruitment.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 채용 통계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecruitmentStatisticsResponse {

    // 채용공고 관련
    private long totalJobPostings;
    private long activeJobPostings;
    private long closedJobPostings;

    // 지원서 관련
    private long totalApplications;
    private long pendingApplications;
    private long screenedApplications;
    private long interviewingApplications;
    private long hiredApplications;
    private long rejectedApplications;

    // 면접 관련
    private long totalInterviews;
    private long scheduledInterviews;
    private long completedInterviews;

    // 제안 관련
    private long totalOffers;
    private long pendingOffers;
    private long acceptedOffers;
    private long declinedOffers;

    // 전환율
    private double screeningPassRate;
    private double interviewPassRate;
    private double offerAcceptRate;
    private double overallConversionRate;

    // 소스별 통계
    private Map<String, Long> applicationsBySource;

    // 부서별 통계
    private Map<String, Long> applicationsByDepartment;
}
