package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.request.VerifyCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.VerificationLogResponse;
import com.hrsaas.certificate.domain.dto.response.VerificationResultResponse;
import com.hrsaas.certificate.service.CertificateVerificationService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * 증명서 진위확인 컨트롤러
 */
@Tag(name = "Certificate Verification", description = "증명서 진위확인 API")
@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateVerificationController {

    private final CertificateVerificationService certificateVerificationService;

    @Operation(summary = "증명서 진위확인 (공개 API)")
    @PostMapping("/verify")
    public ApiResponse<VerificationResultResponse> verify(
            @Valid @RequestBody VerifyCertificateRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        return ApiResponse.success(certificateVerificationService.verify(request, clientIp, userAgent));
    }

    @Operation(summary = "증명서 진위확인 - GET (공개 API)")
    @GetMapping("/verify/{verificationCode}")
    public ApiResponse<VerificationResultResponse> verifyByCode(
            @PathVariable String verificationCode,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        VerifyCertificateRequest request = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        return ApiResponse.success(certificateVerificationService.verify(request, clientIp, userAgent));
    }

    @Operation(summary = "발급 증명서별 진위확인 로그 조회")
    @GetMapping("/issues/{issueId}/verification-logs")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<VerificationLogResponse>> getLogsByIssueId(
            @PathVariable UUID issueId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateVerificationService.getLogsByIssueId(issueId, pageable));
    }

    @Operation(summary = "기간별 진위확인 로그 조회")
    @GetMapping("/verification-logs")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<VerificationLogResponse>> getLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateVerificationService.getLogsByDateRange(startDate, endDate, pageable));
    }

    @Operation(summary = "실패한 진위확인 로그 조회")
    @GetMapping("/verification-logs/failed")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<VerificationLogResponse>> getFailedLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateVerificationService.getFailedLogs(pageable));
    }

    @Operation(summary = "성공한 진위확인 로그 조회")
    @GetMapping("/verification-logs/successful")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<VerificationLogResponse>> getSuccessfulLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateVerificationService.getSuccessfulLogs(pageable));
    }

    @Operation(summary = "기관별 진위확인 로그 조회")
    @GetMapping("/verification-logs/organization")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<VerificationLogResponse>> getLogsByOrganization(
            @RequestParam String organization,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(certificateVerificationService.getLogsByOrganization(organization, pageable));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
