package com.hrsaas.certificate.controller;

import com.hrsaas.certificate.domain.dto.response.CertificateStatisticsResponse;
import com.hrsaas.certificate.service.CertificateStatisticsService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * 증명서 통계 컨트롤러
 */
@Tag(name = "Certificate Statistics", description = "증명서 통계 API")
@RestController
@RequestMapping("/api/v1/certificates/statistics")
@RequiredArgsConstructor
public class CertificateStatisticsController {

    private final CertificateStatisticsService certificateStatisticsService;

    @Operation(summary = "전체 통계 조회")
    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateStatisticsResponse> getStatistics() {
        return ApiResponse.success(certificateStatisticsService.getStatistics());
    }

    @Operation(summary = "기간별 통계 조회")
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<CertificateStatisticsResponse> getStatisticsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        return ApiResponse.success(certificateStatisticsService.getStatisticsByDateRange(startDate, endDate));
    }

    @Operation(summary = "월별 신청 건수 조회")
    @GetMapping("/monthly/requests")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Long> getMonthlyRequestCount(
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.success(certificateStatisticsService.getMonthlyRequestCount(year, month));
    }

    @Operation(summary = "월별 발급 건수 조회")
    @GetMapping("/monthly/issues")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Long> getMonthlyIssueCount(
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.success(certificateStatisticsService.getMonthlyIssueCount(year, month));
    }

    @Operation(summary = "월별 진위확인 건수 조회")
    @GetMapping("/monthly/verifications")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Long> getMonthlyVerificationCount(
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.success(certificateStatisticsService.getMonthlyVerificationCount(year, month));
    }
}
