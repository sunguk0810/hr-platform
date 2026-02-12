package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.client.TenantClient;
import com.hrsaas.certificate.domain.dto.client.TenantInfoResponse;
import com.hrsaas.certificate.domain.dto.request.VerifyCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.VerificationLogResponse;
import com.hrsaas.certificate.domain.dto.response.VerificationResultResponse;
import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.VerificationLog;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.VerificationLogRepository;
import com.hrsaas.certificate.service.CertificateVerificationService;
import com.hrsaas.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * 증명서 진위확인 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateVerificationServiceImpl implements CertificateVerificationService {

    private final CertificateIssueRepository certificateIssueRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final TenantClient tenantClient;

    private static final int MAX_VERIFICATIONS_PER_HOUR = 10;

    @Override
    @Transactional
    public VerificationResultResponse verify(VerifyCertificateRequest request, String clientIp, String userAgent) {
        log.info("Verifying certificate with code: {} from IP: {}", request.getVerificationCode(), clientIp);

        // Rate limiting 체크
        if (isRateLimited(clientIp)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            return createAndSaveFailedLog(null, request, clientIp, userAgent, "요청 횟수가 제한을 초과했습니다");
        }

        Optional<CertificateIssue> issueOpt = certificateIssueRepository.findByVerificationCode(request.getVerificationCode());

        if (issueOpt.isEmpty()) {
            log.warn("Certificate not found for code: {}", request.getVerificationCode());
            return createAndSaveFailedLog(null, request, clientIp, userAgent, "해당 진위확인 코드에 해당하는 증명서가 없습니다");
        }

        CertificateIssue issue = issueOpt.get();

        // 취소 여부 확인
        if (issue.isRevoked()) {
            log.warn("Certificate is revoked: {}", issue.getIssueNumber());
            createAndSaveLog(issue, request, clientIp, userAgent, false, "취소된 증명서입니다");
            return VerificationResultResponse.revoked(
                    issue.getRequest().getCertificateType().getName(),
                    issue.getRequest().getEmployeeName(),
                    issue.getIssueNumber(),
                    issue.getIssuedAt(),
                    issue.getExpiresAt(),
                    issue.getRevokeReason()
            );
        }

        // 만료 여부 확인
        if (issue.isExpired()) {
            log.warn("Certificate is expired: {}", issue.getIssueNumber());
            createAndSaveLog(issue, request, clientIp, userAgent, false, "만료된 증명서입니다");
            return VerificationResultResponse.expired(
                    issue.getRequest().getCertificateType().getName(),
                    issue.getRequest().getEmployeeName(),
                    issue.getIssueNumber(),
                    issue.getIssuedAt(),
                    issue.getExpiresAt()
            );
        }

        // 유효한 증명서
        log.info("Certificate verified successfully: {}", issue.getIssueNumber());
        createAndSaveLog(issue, request, clientIp, userAgent, true, null);
        issue.markVerified();
        certificateIssueRepository.save(issue);

        String companyName = "회사명";
        try {
            ApiResponse<TenantInfoResponse> response = tenantClient.getInternalInfo(issue.getTenantId());
            if (response != null && response.getData() != null) {
                companyName = response.getData().getName();
            }
        } catch (Exception e) {
            log.error("Failed to fetch tenant info for id: {}", issue.getTenantId(), e);
        }

        return VerificationResultResponse.success(
                issue.getRequest().getCertificateType().getName(),
                issue.getRequest().getEmployeeName(),
                issue.getIssueNumber(),
                issue.getIssuedAt(),
                issue.getExpiresAt(),
                companyName
        );
    }

    @Override
    public Page<VerificationLogResponse> getLogsByIssueId(UUID issueId, Pageable pageable) {
        return verificationLogRepository.findByIssueIdOrderByVerifiedAtDesc(issueId, pageable)
                .map(VerificationLogResponse::from);
    }

    @Override
    public Page<VerificationLogResponse> getLogsByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        return verificationLogRepository.findByDateRange(startDate, endDate, pageable)
                .map(VerificationLogResponse::from);
    }

    @Override
    public Page<VerificationLogResponse> getFailedLogs(Pageable pageable) {
        return verificationLogRepository.findByValidFalseOrderByVerifiedAtDesc(pageable)
                .map(VerificationLogResponse::from);
    }

    @Override
    public Page<VerificationLogResponse> getSuccessfulLogs(Pageable pageable) {
        return verificationLogRepository.findByValidTrueOrderByVerifiedAtDesc(pageable)
                .map(VerificationLogResponse::from);
    }

    @Override
    public Page<VerificationLogResponse> getLogsByOrganization(String organization, Pageable pageable) {
        return verificationLogRepository.findByVerifierOrganizationOrderByVerifiedAtDesc(organization, pageable)
                .map(VerificationLogResponse::from);
    }

    @Override
    public boolean isRateLimited(String clientIp) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long count = verificationLogRepository.countByIpSince(clientIp, oneHourAgo);
        return count >= MAX_VERIFICATIONS_PER_HOUR;
    }

    private void createAndSaveLog(CertificateIssue issue, VerifyCertificateRequest request,
                                  String clientIp, String userAgent, boolean valid, String failureReason) {
        VerificationLog log = VerificationLog.builder()
                .issue(issue)
                .verificationCode(request.getVerificationCode())
                .verifierIp(clientIp)
                .verifierUserAgent(userAgent)
                .verifierName(request.getVerifierName())
                .verifierOrganization(request.getVerifierOrganization())
                .valid(valid)
                .failureReason(failureReason)
                .build();

        verificationLogRepository.save(log);
    }

    private VerificationResultResponse createAndSaveFailedLog(CertificateIssue issue, VerifyCertificateRequest request,
                                                               String clientIp, String userAgent, String failureReason) {
        createAndSaveLog(issue, request, clientIp, userAgent, false, failureReason);
        return VerificationResultResponse.builder()
                .valid(false)
                .failureReason(failureReason)
                .verifiedAt(Instant.now())
                .build();
    }
}
