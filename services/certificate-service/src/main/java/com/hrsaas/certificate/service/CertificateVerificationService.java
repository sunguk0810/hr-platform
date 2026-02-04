package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.request.VerifyCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.VerificationLogResponse;
import com.hrsaas.certificate.domain.dto.response.VerificationResultResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

/**
 * 증명서 진위확인 서비스 인터페이스
 */
public interface CertificateVerificationService {

    /**
     * 진위확인 수행
     */
    VerificationResultResponse verify(VerifyCertificateRequest request, String clientIp, String userAgent);

    /**
     * 발급 증명서별 진위확인 로그 조회
     */
    Page<VerificationLogResponse> getLogsByIssueId(UUID issueId, Pageable pageable);

    /**
     * 기간별 진위확인 로그 조회
     */
    Page<VerificationLogResponse> getLogsByDateRange(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * 실패한 진위확인 로그 조회
     */
    Page<VerificationLogResponse> getFailedLogs(Pageable pageable);

    /**
     * 성공한 진위확인 로그 조회
     */
    Page<VerificationLogResponse> getSuccessfulLogs(Pageable pageable);

    /**
     * 기관별 진위확인 로그 조회
     */
    Page<VerificationLogResponse> getLogsByOrganization(String organization, Pageable pageable);

    /**
     * IP별 확인 건수 체크 (Rate Limiting)
     */
    boolean isRateLimited(String clientIp);
}
