package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.request.IssueCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.RevokeCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateIssueResponse;
import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.CertificateRequestRepository;
import com.hrsaas.certificate.repository.CertificateTemplateRepository;
import com.hrsaas.certificate.service.CertificateIssueService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * 증명서 발급 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateIssueServiceImpl implements CertificateIssueService {

    private final CertificateIssueRepository certificateIssueRepository;
    private final CertificateRequestRepository certificateRequestRepository;
    private final CertificateTemplateRepository certificateTemplateRepository;

    private static final AtomicLong issueSequence = new AtomicLong(1);
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final String VERIFICATION_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int VERIFICATION_CODE_LENGTH = 12;
    private static final int VERIFICATION_CODE_GROUP_SIZE = 4;

    @Override
    @Transactional
    public CertificateIssueResponse issue(UUID requestId, IssueCertificateRequest request) {
        log.info("Issuing certificate for request: {}", requestId);

        CertificateRequest certificateRequest = certificateRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + requestId));

        // 결재 필요 유형인 경우 승인 상태 확인
        if (certificateRequest.getCertificateType().isRequiresApproval()) {
            if (certificateRequest.getStatus() != RequestStatus.APPROVED) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST, "승인된 신청만 발급할 수 있습니다");
            }
        } else {
            if (certificateRequest.getStatus() != RequestStatus.PENDING &&
                certificateRequest.getStatus() != RequestStatus.APPROVED) {
                throw new BusinessException(ErrorCode.INVALID_REQUEST, "발급 가능한 상태가 아닙니다");
            }
        }

        String issueNumber = generateIssueNumber();
        String verificationCode = generateVerificationCode();

        // 만료일 계산
        LocalDate expiresAt = request.getExpiresAt() != null
                ? request.getExpiresAt()
                : LocalDate.now().plusDays(certificateRequest.getCertificateType().getValidDays());

        // 컨텐츠 스냅샷 생성
        Map<String, Object> contentSnapshot = createContentSnapshot(certificateRequest);

        CertificateIssue issue = CertificateIssue.builder()
                .request(certificateRequest)
                .issueNumber(issueNumber)
                .verificationCode(verificationCode)
                .contentSnapshot(contentSnapshot)
                .issuedBy(request.getIssuedBy())
                .expiresAt(expiresAt)
                .build();

        CertificateIssue saved = certificateIssueRepository.save(issue);

        // 신청 상태 업데이트
        certificateRequest.issue(request.getIssuedBy());
        certificateRequestRepository.save(certificateRequest);

        log.info("Certificate issued: {} with verification code: {}", saved.getIssueNumber(), saved.getVerificationCode());
        return CertificateIssueResponse.from(saved);
    }

    @Override
    public CertificateIssueResponse getById(UUID id) {
        CertificateIssue issue = certificateIssueRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다: " + id));
        return CertificateIssueResponse.from(issue);
    }

    @Override
    public CertificateIssueResponse getByIssueNumber(String issueNumber) {
        CertificateIssue issue = certificateIssueRepository.findByIssueNumber(issueNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다: " + issueNumber));
        return CertificateIssueResponse.from(issue);
    }

    @Override
    public CertificateIssueResponse getByVerificationCode(String verificationCode) {
        CertificateIssue issue = certificateIssueRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다"));
        return CertificateIssueResponse.from(issue);
    }

    @Override
    public List<CertificateIssueResponse> getByRequestId(UUID requestId) {
        return certificateIssueRepository.findByRequestIdOrderByIssuedAtDesc(requestId).stream()
                .map(CertificateIssueResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public Page<CertificateIssueResponse> getByEmployeeId(UUID employeeId, Pageable pageable) {
        return certificateIssueRepository.findByEmployeeId(employeeId, pageable)
                .map(CertificateIssueResponse::from);
    }

    @Override
    public Page<CertificateIssueResponse> getByIssuedDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        return certificateIssueRepository.findByIssuedDateRange(startDate, endDate, pageable)
                .map(CertificateIssueResponse::from);
    }

    @Override
    public Page<CertificateIssueResponse> getValidCertificates(Pageable pageable) {
        return certificateIssueRepository.findValidCertificates(LocalDate.now(), pageable)
                .map(CertificateIssueResponse::from);
    }

    @Override
    public List<CertificateIssueResponse> getExpiringSoon(LocalDate expiresDate) {
        return certificateIssueRepository.findExpiringSoon(expiresDate).stream()
                .map(CertificateIssueResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CertificateIssueResponse revoke(UUID id, RevokeCertificateRequest request) {
        log.info("Revoking certificate: {}", id);

        CertificateIssue issue = certificateIssueRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다: " + id));

        if (issue.isRevoked()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "이미 취소된 증명서입니다");
        }

        issue.revoke(request.getRevokedBy(), request.getReason());
        CertificateIssue saved = certificateIssueRepository.save(issue);

        log.info("Certificate revoked: {}", saved.getIssueNumber());
        return CertificateIssueResponse.from(saved);
    }

    @Override
    @Transactional
    public CertificateIssueResponse markDownloaded(UUID id) {
        log.info("Marking certificate as downloaded: {}", id);

        CertificateIssue issue = certificateIssueRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다: " + id));

        issue.markDownloaded();
        CertificateIssue saved = certificateIssueRepository.save(issue);

        return CertificateIssueResponse.from(saved);
    }

    @Override
    public byte[] downloadPdf(UUID id) {
        log.info("Downloading PDF for certificate: {}", id);

        CertificateIssue issue = certificateIssueRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다: " + id));

        if (!issue.isValid()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "유효하지 않은 증명서입니다");
        }

        // PDF 생성 로직 (실제 구현 시 별도 서비스로 분리)
        // TODO: Flying Saucer 또는 iText를 사용한 PDF 생성
        return new byte[0];
    }

    @Override
    public CertificateIssueResponse getByFileId(UUID fileId) {
        CertificateIssue issue = certificateIssueRepository.findByFileId(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다"));
        return CertificateIssueResponse.from(issue);
    }

    private String generateIssueNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long sequence = issueSequence.getAndIncrement();
        return String.format("CERT-%s-%06d", datePrefix, sequence);
    }

    private String generateVerificationCode() {
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
            code.append(VERIFICATION_CHARS.charAt(secureRandom.nextInt(VERIFICATION_CHARS.length())));
            if ((i + 1) % VERIFICATION_CODE_GROUP_SIZE == 0 && i < VERIFICATION_CODE_LENGTH - 1) {
                code.append("-");
            }
        }
        return code.toString();
    }

    private Map<String, Object> createContentSnapshot(CertificateRequest request) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("employeeName", request.getEmployeeName());
        snapshot.put("employeeNumber", request.getEmployeeNumber());
        snapshot.put("certificateType", request.getCertificateType().getName());
        snapshot.put("purpose", request.getPurpose());
        snapshot.put("submissionTarget", request.getSubmissionTarget());
        snapshot.put("language", request.getLanguage());
        snapshot.put("includeSalary", request.isIncludeSalary());
        snapshot.put("periodFrom", request.getPeriodFrom());
        snapshot.put("periodTo", request.getPeriodTo());
        snapshot.put("customFields", request.getCustomFields());
        snapshot.put("issuedAt", Instant.now().toString());
        return snapshot;
    }
}
