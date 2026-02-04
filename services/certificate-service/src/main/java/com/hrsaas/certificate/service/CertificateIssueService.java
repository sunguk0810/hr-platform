package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.request.IssueCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.RevokeCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateIssueResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 증명서 발급 서비스 인터페이스
 */
public interface CertificateIssueService {

    /**
     * 증명서 발급
     */
    CertificateIssueResponse issue(UUID requestId, IssueCertificateRequest request);

    /**
     * 발급 증명서 조회
     */
    CertificateIssueResponse getById(UUID id);

    /**
     * 발급번호로 조회
     */
    CertificateIssueResponse getByIssueNumber(String issueNumber);

    /**
     * 진위확인 코드로 조회
     */
    CertificateIssueResponse getByVerificationCode(String verificationCode);

    /**
     * 신청별 발급 증명서 목록
     */
    List<CertificateIssueResponse> getByRequestId(UUID requestId);

    /**
     * 직원별 발급 증명서 목록
     */
    Page<CertificateIssueResponse> getByEmployeeId(UUID employeeId, Pageable pageable);

    /**
     * 기간별 발급 목록
     */
    Page<CertificateIssueResponse> getByIssuedDateRange(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * 유효한 증명서 목록
     */
    Page<CertificateIssueResponse> getValidCertificates(Pageable pageable);

    /**
     * 만료 예정 증명서 목록
     */
    List<CertificateIssueResponse> getExpiringSoon(LocalDate expiresDate);

    /**
     * 증명서 취소
     */
    CertificateIssueResponse revoke(UUID id, RevokeCertificateRequest request);

    /**
     * 다운로드 처리
     */
    CertificateIssueResponse markDownloaded(UUID id);

    /**
     * PDF 다운로드
     */
    byte[] downloadPdf(UUID id);

    /**
     * 파일 ID로 조회
     */
    CertificateIssueResponse getByFileId(UUID fileId);
}
