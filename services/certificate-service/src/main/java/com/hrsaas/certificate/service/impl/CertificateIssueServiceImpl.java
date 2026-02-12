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
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
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

        return generatePdf(issue);
    }

    @Override
    public CertificateIssueResponse getByFileId(UUID fileId) {
        CertificateIssue issue = certificateIssueRepository.findByFileId(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "발급 증명서를 찾을 수 없습니다"));
        return CertificateIssueResponse.from(issue);
    }

    private String generateIssueNumber() {
        UUID tenantId = TenantContext.getCurrentTenant();
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = String.format("CERT-%s-", datePrefix);

        List<String> latestIssueNumbers = certificateIssueRepository.findLatestIssueNumbers(
                tenantId, prefix, PageRequest.of(0, 1));

        String maxIssueNumber = latestIssueNumbers.isEmpty() ? null : latestIssueNumbers.get(0);

        long nextSequence = 1;
        if (maxIssueNumber != null) {
            try {
                String suffix = maxIssueNumber.substring(prefix.length());
                nextSequence = Long.parseLong(suffix) + 1;
            } catch (Exception e) {
                log.warn("Failed to parse sequence from issue number: {}", maxIssueNumber);
                // If parsing fails, we might want to throw an exception to avoid duplicates
                // or just log and try 1 (which will likely fail on insert if unique constraint exists)
                // Here we choose to proceed with 1 but it's risky. Ideally data should be clean.
            }
        }

        return String.format("%s%06d", prefix, nextSequence);
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

    private byte[] generatePdf(CertificateIssue issue) {
        Map<String, Object> snapshot = issue.getContentSnapshot() != null
                ? issue.getContentSnapshot()
                : Map.of();

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            document.add(new Paragraph("HR SaaS Certificate").setBold().setFontSize(16));
            document.add(new Paragraph("Issue Number: " + issue.getIssueNumber()));
            document.add(new Paragraph("Verification Code: " + issue.getVerificationCode()));
            document.add(new Paragraph("Issued At: " + issue.getIssuedAt()));
            document.add(new Paragraph("Expires At: " + issue.getExpiresAt()));
            document.add(new Paragraph("Employee Name: " + String.valueOf(snapshot.getOrDefault("employeeName", "-"))));
            document.add(new Paragraph("Employee Number: " + String.valueOf(snapshot.getOrDefault("employeeNumber", "-"))));
            document.add(new Paragraph("Certificate Type: " + String.valueOf(snapshot.getOrDefault("certificateType", "-"))));
            document.add(new Paragraph("Purpose: " + String.valueOf(snapshot.getOrDefault("purpose", "-"))));
            document.add(new Paragraph("Submission Target: " + String.valueOf(snapshot.getOrDefault("submissionTarget", "-"))));

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate certificate PDF: issueId={}", issue.getId(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "증명서 PDF 생성에 실패했습니다");
        }
    }
}
