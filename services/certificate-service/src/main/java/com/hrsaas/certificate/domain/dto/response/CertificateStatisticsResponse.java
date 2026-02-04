package com.hrsaas.certificate.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 증명서 통계 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateStatisticsResponse {

    // 신청 관련 통계
    private long totalRequests;
    private long pendingRequests;
    private long approvedRequests;
    private long rejectedRequests;
    private long issuedRequests;
    private long cancelledRequests;

    // 발급 관련 통계
    private long totalIssued;
    private long validCertificates;
    private long expiredCertificates;
    private long revokedCertificates;

    // 진위확인 관련 통계
    private long totalVerifications;
    private long successfulVerifications;
    private long failedVerifications;

    // 다운로드 관련 통계
    private long totalDownloads;

    // 유형별 통계
    private Map<String, Long> requestsByType;
    private Map<String, Long> issuesByType;

    // 기간별 통계
    private Map<String, Long> monthlyRequests;
    private Map<String, Long> monthlyIssues;
}
