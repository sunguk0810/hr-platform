package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.response.CertificateStatisticsResponse;

import java.time.Instant;

/**
 * 증명서 통계 서비스 인터페이스
 */
public interface CertificateStatisticsService {

    /**
     * 전체 통계 조회
     */
    CertificateStatisticsResponse getStatistics();

    /**
     * 기간별 통계 조회
     */
    CertificateStatisticsResponse getStatisticsByDateRange(Instant startDate, Instant endDate);

    /**
     * 월별 신청 건수
     */
    long getMonthlyRequestCount(int year, int month);

    /**
     * 월별 발급 건수
     */
    long getMonthlyIssueCount(int year, int month);

    /**
     * 월별 진위확인 건수
     */
    long getMonthlyVerificationCount(int year, int month);
}
