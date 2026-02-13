package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.request.ApproveCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.CreateCertificateRequestRequest;
import com.hrsaas.certificate.domain.dto.request.RejectCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateRequestResponse;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.repository.CertificateRequestRepository;
import com.hrsaas.certificate.repository.CertificateTypeRepository;
import com.hrsaas.certificate.service.CertificateRequestService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.hrsaas.common.security.SecurityContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 증명서 신청 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateRequestServiceImpl implements CertificateRequestService {

    private final CertificateRequestRepository certificateRequestRepository;
    private final CertificateTypeRepository certificateTypeRepository;

    private static final AtomicLong requestSequence = new AtomicLong(1);

    @Override
    @Transactional
    public CertificateRequestResponse create(CreateCertificateRequestRequest request) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        if (employeeId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "인증 정보에서 직원 식별자를 확인할 수 없습니다");
        }

        log.info("Creating certificate request for employee: {}", employeeId);

        CertificateType certificateType = certificateTypeRepository.findById(request.getCertificateTypeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND,
                        "증명서 유형을 찾을 수 없습니다: " + request.getCertificateTypeId()));

        if (!certificateType.isActive()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "비활성화된 증명서 유형입니다");
        }

        // 발급 부수 검증
        if (request.getCopies() != null && request.getCopies() > certificateType.getMaxCopiesPerRequest()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                    "최대 발급 부수를 초과했습니다. 최대: " + certificateType.getMaxCopiesPerRequest());
        }

        String requestNumber = generateRequestNumber();

        CertificateRequest certificateRequest = CertificateRequest.builder()
                .certificateType(certificateType)
                .employeeId(employeeId)
                .requestNumber(requestNumber)
                .purpose(request.getPurpose())
                .submissionTarget(request.getSubmissionTarget())
                .copies(request.getCopies())
                .language(request.getLanguage())
                .includeSalary(request.isIncludeSalary())
                .periodFrom(request.getPeriodFrom())
                .periodTo(request.getPeriodTo())
                .customFields(request.getCustomFields())
                .remarks(request.getRemarks())
                .build();

        CertificateRequest saved = certificateRequestRepository.save(certificateRequest);
        log.info("Certificate request created: {}", saved.getRequestNumber());

        return CertificateRequestResponse.from(saved);
    }

    @Override
    public CertificateRequestResponse getById(UUID id) {
        CertificateRequest request = certificateRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + id));
        return CertificateRequestResponse.from(request);
    }

    @Override
    public CertificateRequestResponse getByRequestNumber(String requestNumber) {
        CertificateRequest request = certificateRequestRepository.findByRequestNumber(requestNumber)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + requestNumber));
        return CertificateRequestResponse.from(request);
    }

    @Override
    public Page<CertificateRequestResponse> getByEmployeeId(UUID employeeId, Pageable pageable) {
        return certificateRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId, pageable)
                .map(CertificateRequestResponse::from);
    }

    @Override
    public Page<CertificateRequestResponse> getByEmployeeIdAndStatus(UUID employeeId, RequestStatus status, Pageable pageable) {
        return certificateRequestRepository.findByEmployeeIdAndStatusOrderByCreatedAtDesc(employeeId, status, pageable)
                .map(CertificateRequestResponse::from);
    }

    @Override
    public Page<CertificateRequestResponse> getByStatus(RequestStatus status, Pageable pageable) {
        return certificateRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(CertificateRequestResponse::from);
    }

    @Override
    public Page<CertificateRequestResponse> getByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        return certificateRequestRepository.findByDateRange(startDate, endDate, pageable)
                .map(CertificateRequestResponse::from);
    }

    @Override
    @Transactional
    public CertificateRequestResponse approve(UUID id, ApproveCertificateRequest request) {
        log.info("Approving certificate request: {}", id);

        CertificateRequest certificateRequest = certificateRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + id));

        if (certificateRequest.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "승인 대기 상태가 아닙니다");
        }

        certificateRequest.approve(request.getApprovedBy());
        CertificateRequest saved = certificateRequestRepository.save(certificateRequest);

        log.info("Certificate request approved: {}", saved.getRequestNumber());
        return CertificateRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public CertificateRequestResponse reject(UUID id, RejectCertificateRequest request) {
        log.info("Rejecting certificate request: {}", id);

        CertificateRequest certificateRequest = certificateRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + id));

        if (certificateRequest.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "승인 대기 상태가 아닙니다");
        }

        certificateRequest.reject(request.getReason());
        CertificateRequest saved = certificateRequestRepository.save(certificateRequest);

        log.info("Certificate request rejected: {}", saved.getRequestNumber());
        return CertificateRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public CertificateRequestResponse cancel(UUID id) {
        log.info("Cancelling certificate request: {}", id);

        CertificateRequest certificateRequest = certificateRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "신청을 찾을 수 없습니다: " + id));

        if (certificateRequest.getStatus() == RequestStatus.ISSUED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST, "이미 발급된 신청은 취소할 수 없습니다");
        }

        certificateRequest.cancel();
        CertificateRequest saved = certificateRequestRepository.save(certificateRequest);

        log.info("Certificate request cancelled: {}", saved.getRequestNumber());
        return CertificateRequestResponse.from(saved);
    }

    @Override
    public Page<CertificateRequestResponse> searchByEmployee(String keyword, Pageable pageable) {
        return certificateRequestRepository.searchByEmployee(keyword, pageable)
                .map(CertificateRequestResponse::from);
    }

    @Override
    public Page<CertificateRequestResponse> getMyRequests(UUID employeeId, Pageable pageable) {
        if (employeeId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "인증 정보에서 직원 식별자를 확인할 수 없습니다");
        }

        return getByEmployeeId(employeeId, pageable);
    }

    @Override
    public Page<CertificateRequestResponse> getMyRequests(UUID employeeId, RequestStatus status, String typeCode, Pageable pageable) {
        if (employeeId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "인증 정보에서 직원 식별자를 확인할 수 없습니다");
        }

        if (status != null && typeCode != null && !typeCode.isBlank()) {
            return certificateRequestRepository
                    .findByEmployeeIdAndCertificateTypeCodeAndStatusOrderByCreatedAtDesc(
                            employeeId,
                            typeCode,
                            status,
                            pageable)
                    .map(CertificateRequestResponse::from);
        }

        if (status != null) {
            return getByEmployeeIdAndStatus(employeeId, status, pageable);
        }

        if (typeCode != null && !typeCode.isBlank()) {
            return certificateRequestRepository
                    .findByEmployeeIdAndCertificateTypeCodeOrderByCreatedAtDesc(employeeId, typeCode, pageable)
                    .map(CertificateRequestResponse::from);
        }

        return getByEmployeeId(employeeId, pageable);
    }

    private String generateRequestNumber() {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long sequence = requestSequence.getAndIncrement();
        return String.format("REQ-%s-%06d", datePrefix, sequence);
    }
}
