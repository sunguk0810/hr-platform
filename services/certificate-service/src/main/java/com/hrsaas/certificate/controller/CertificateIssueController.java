package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.request.IssueCertificateRequest;
import com.hrsaas.certificate.domain.dto.request.RevokeCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateIssueResponse;
import com.hrsaas.certificate.service.CertificateIssueService;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 증명서 발급 컨트롤러
 */
@Tag(name = "Certificate Issue", description = "증명서 발급 관리 API")
@RestController
@RequestMapping("/api/v1/certificates/issues")
@RequiredArgsConstructor
public class CertificateIssueController {

    private final CertificateIssueService certificateIssueService;

    @Operation(summary = "증명서 발급")
    @PostMapping("/request/{requestId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateIssueResponse> issue(
            @PathVariable UUID requestId,
            @Valid @RequestBody IssueCertificateRequest request) {
        return ApiResponse.success(certificateIssueService.issue(requestId, request));
    }

    @Operation(summary = "내 발급 증명서 목록 조회")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CertificateIssueResponse>> getMyIssues(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID employeeId = SecurityContextHolder.getCurrentUser().getEmployeeId();
        return ApiResponse.success(certificateIssueService.getByEmployeeId(employeeId, pageable));
    }

    @Operation(summary = "발급 증명서 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateIssueResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(certificateIssueService.getById(id));
    }

    @Operation(summary = "발급번호로 조회")
    @GetMapping("/number/{issueNumber}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CertificateIssueResponse> getByIssueNumber(@PathVariable String issueNumber) {
        return ApiResponse.success(certificateIssueService.getByIssueNumber(issueNumber));
    }

    @Operation(summary = "신청별 발급 증명서 목록")
    @GetMapping("/request/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CertificateIssueResponse>> getByRequestId(@PathVariable UUID requestId) {
        return ApiResponse.success(certificateIssueService.getByRequestId(requestId));
    }

    @Operation(summary = "직원별 발급 증명서 목록")
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CertificateIssueResponse>> getByEmployeeId(
            @PathVariable UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateIssueService.getByEmployeeId(employeeId, pageable));
    }

    @Operation(summary = "기간별 발급 목록")
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<CertificateIssueResponse>> getByIssuedDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateIssueService.getByIssuedDateRange(startDate, endDate, pageable));
    }

    @Operation(summary = "유효한 증명서 목록")
    @GetMapping("/valid")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<CertificateIssueResponse>> getValidCertificates(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateIssueService.getValidCertificates(pageable));
    }

    @Operation(summary = "만료 예정 증명서 목록")
    @GetMapping("/expiring-soon")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<List<CertificateIssueResponse>> getExpiringSoon(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiresDate) {
        return ApiResponse.success(certificateIssueService.getExpiringSoon(expiresDate));
    }

    @Operation(summary = "증명서 취소")
    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateIssueResponse> revoke(
            @PathVariable UUID id,
            @Valid @RequestBody RevokeCertificateRequest request) {
        return ApiResponse.success(certificateIssueService.revoke(id, request));
    }

    @Operation(summary = "증명서 PDF 다운로드")
    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable UUID id) {
        // 다운로드 마킹
        certificateIssueService.markDownloaded(id);

        byte[] pdfContent = certificateIssueService.downloadPdf(id);

        CertificateIssueResponse issue = certificateIssueService.getById(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", issue.getIssueNumber() + ".pdf");
        headers.setContentLength(pdfContent.length);

        return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
    }
}
