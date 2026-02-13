package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.request.ApproveCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.CreateCertificateRequestRequest;
import com.hrsaas.certificate.domain.dto.request.RejectCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateRequestResponse;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.service.CertificateRequestService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 증명서 신청 컨트롤러
 */
@Tag(name = "Certificate Request", description = "증명서 신청 관리 API")
@RestController
@RequestMapping("/api/v1/certificates/requests")
@RequiredArgsConstructor
public class CertificateRequestController {

    private final CertificateRequestService certificateRequestService;

    @Operation(summary = "증명서 신청")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateRequestResponse> create(@Valid @RequestBody CreateCertificateRequestRequest request) {
        return ApiResponse.success(certificateRequestService.create(request));
    }

    @Operation(summary = "신청 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateRequestResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(certificateRequestService.getById(id));
    }

    @Operation(summary = "신청번호로 조회")
    @GetMapping("/number/{requestNumber}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateRequestResponse> getByRequestNumber(@PathVariable String requestNumber) {
        return ApiResponse.success(certificateRequestService.getByRequestNumber(requestNumber));
    }

    @Operation(summary = "직원별 신청 목록 조회")
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CertificateRequestResponse>> getByEmployeeId(
            @PathVariable UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateRequestService.getByEmployeeId(employeeId, pageable));
    }

    @Operation(summary = "직원별 상태별 신청 목록 조회")
    @GetMapping("/employee/{employeeId}/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CertificateRequestResponse>> getByEmployeeIdAndStatus(
            @PathVariable UUID employeeId,
            @PathVariable RequestStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateRequestService.getByEmployeeIdAndStatus(employeeId, status, pageable));
    }

    @Operation(summary = "상태별 신청 목록 조회")
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<CertificateRequestResponse>> getByStatus(
            @PathVariable RequestStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateRequestService.getByStatus(status, pageable));
    }

    @Operation(summary = "기간별 신청 목록 조회")
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<CertificateRequestResponse>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateRequestService.getByDateRange(startDate, endDate, pageable));
    }

    @Operation(summary = "신청 승인")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateRequestResponse> approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveCertificateRequest request) {
        return ApiResponse.success(certificateRequestService.approve(id, request));
    }

    @Operation(summary = "신청 반려")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateRequestResponse> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectCertificateRequest request) {
        return ApiResponse.success(certificateRequestService.reject(id, request));
    }

    @Operation(summary = "신청 취소")
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateRequestResponse> cancel(@PathVariable UUID id) {
        return ApiResponse.success(certificateRequestService.cancel(id));
    }

    @Operation(summary = "직원 검색")
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<CertificateRequestResponse>> searchByEmployee(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateRequestService.searchByEmployee(keyword, pageable));
    }

    @Operation(summary = "내 신청 목록 조회")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CertificateRequestResponse>> getMyRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) String typeCode,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        return ApiResponse.success(certificateRequestService.getMyRequests(employeeId, status, typeCode, pageable));
    }
}
