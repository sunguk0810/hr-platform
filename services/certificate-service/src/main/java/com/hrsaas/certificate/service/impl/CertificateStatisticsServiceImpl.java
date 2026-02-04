package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.response.CertificateStatisticsResponse;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.CertificateRequestRepository;
import com.hrsaas.certificate.repository.VerificationLogRepository;
import com.hrsaas.certificate.service.CertificateStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

/**
 * 증명서 통계 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateStatisticsServiceImpl implements CertificateStatisticsService {

    private final CertificateRequestRepository certificateRequestRepository;
    private final CertificateIssueRepository certificateIssueRepository;
    private final VerificationLogRepository verificationLogRepository;

    @Override
    public CertificateStatisticsResponse getStatistics() {
        log.info("Getting certificate statistics");

        // 신청 관련 통계
        long totalRequests = certificateRequestRepository.count();
        long pendingRequests = certificateRequestRepository.countByStatus(RequestStatus.PENDING);
        long approvedRequests = certificateRequestRepository.countByStatus(RequestStatus.APPROVED);
        long rejectedRequests = certificateRequestRepository.countByStatus(RequestStatus.REJECTED);
        long issuedRequests = certificateRequestRepository.countByStatus(RequestStatus.ISSUED);
        long cancelledRequests = certificateRequestRepository.countByStatus(RequestStatus.CANCELLED);

        // 발급 관련 통계
        long totalIssued = certificateIssueRepository.count();
        long validCertificates = certificateIssueRepository.findValidCertificates(LocalDate.now(), null).getTotalElements();
        long expiredCertificates = certificateIssueRepository.findExpired(LocalDate.now()).size();

        // 진위확인 관련 통계
        long totalVerifications = verificationLogRepository.count();

        return CertificateStatisticsResponse.builder()
                .totalRequests(totalRequests)
                .pendingRequests(pendingRequests)
                .approvedRequests(approvedRequests)
                .rejectedRequests(rejectedRequests)
                .issuedRequests(issuedRequests)
                .cancelledRequests(cancelledRequests)
                .totalIssued(totalIssued)
                .validCertificates(validCertificates)
                .expiredCertificates(expiredCertificates)
                .totalVerifications(totalVerifications)
                .build();
    }

    @Override
    public CertificateStatisticsResponse getStatisticsByDateRange(Instant startDate, Instant endDate) {
        log.info("Getting certificate statistics for date range: {} - {}", startDate, endDate);

        // 기간별 신청 건수
        long totalRequests = certificateRequestRepository.findByDateRange(startDate, endDate, null).getTotalElements();

        // 기간별 발급 건수
        long totalIssued = certificateIssueRepository.countByIssuedDateRange(startDate, endDate);

        // 기간별 진위확인 건수
        long totalVerifications = verificationLogRepository.countByDateRange(startDate, endDate);
        long successfulVerifications = verificationLogRepository.countByDateRangeAndValidity(startDate, endDate, true);
        long failedVerifications = verificationLogRepository.countByDateRangeAndValidity(startDate, endDate, false);

        return CertificateStatisticsResponse.builder()
                .totalRequests(totalRequests)
                .totalIssued(totalIssued)
                .totalVerifications(totalVerifications)
                .successfulVerifications(successfulVerifications)
                .failedVerifications(failedVerifications)
                .build();
    }

    @Override
    public long getMonthlyRequestCount(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant startDate = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        return certificateRequestRepository.findByDateRange(startDate, endDate, null).getTotalElements();
    }

    @Override
    public long getMonthlyIssueCount(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant startDate = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        return certificateIssueRepository.countByIssuedDateRange(startDate, endDate);
    }

    @Override
    public long getMonthlyVerificationCount(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        Instant startDate = yearMonth.atDay(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        return verificationLogRepository.countByDateRange(startDate, endDate);
    }
}
