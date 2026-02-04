package com.hrsaas.certificate.service;

import com.hrsaas.certificate.domain.dto.request.ApproveCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.CreateCertificateRequestRequest;
import com.hrsaas.certificate.domain.dto.request.RejectCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateRequestResponse;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

/**
 * 증명서 신청 서비스 인터페이스
 */
public interface CertificateRequestService {

    /**
     * 증명서 신청
     */
    CertificateRequestResponse create(CreateCertificateRequestRequest request);

    /**
     * 신청 조회
     */
    CertificateRequestResponse getById(UUID id);

    /**
     * 신청번호로 조회
     */
    CertificateRequestResponse getByRequestNumber(String requestNumber);

    /**
     * 직원별 신청 목록 조회
     */
    Page<CertificateRequestResponse> getByEmployeeId(UUID employeeId, Pageable pageable);

    /**
     * 직원별 상태별 신청 목록 조회
     */
    Page<CertificateRequestResponse> getByEmployeeIdAndStatus(UUID employeeId, RequestStatus status, Pageable pageable);

    /**
     * 상태별 신청 목록 조회
     */
    Page<CertificateRequestResponse> getByStatus(RequestStatus status, Pageable pageable);

    /**
     * 기간별 신청 목록 조회
     */
    Page<CertificateRequestResponse> getByDateRange(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * 신청 승인
     */
    CertificateRequestResponse approve(UUID id, ApproveCertificateRequest request);

    /**
     * 신청 반려
     */
    CertificateRequestResponse reject(UUID id, RejectCertificateRequest request);

    /**
     * 신청 취소
     */
    CertificateRequestResponse cancel(UUID id);

    /**
     * 직원 검색
     */
    Page<CertificateRequestResponse> searchByEmployee(String keyword, Pageable pageable);

    /**
     * 내 신청 목록 조회 (현재 로그인 사용자)
     */
    Page<CertificateRequestResponse> getMyRequests(UUID employeeId, Pageable pageable);
}
