package com.hrsaas.recruitment.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicationRequest;
import com.hrsaas.recruitment.domain.dto.request.ScreenApplicationRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicationResponse;
import com.hrsaas.recruitment.domain.dto.response.ApplicationSummaryResponse;
import com.hrsaas.recruitment.domain.entity.ApplicationStatus;
import com.hrsaas.recruitment.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 지원서 컨트롤러
 */
@Tag(name = "Application", description = "지원서 관리 API")
@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @Operation(summary = "지원서 제출 (공개)")
    @PostMapping("/public")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApplicationResponse> create(@Valid @RequestBody CreateApplicationRequest request) {
        return ApiResponse.success(applicationService.create(request));
    }

    @Operation(summary = "지원서 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicationResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(applicationService.getById(id));
    }

    @Operation(summary = "지원번호로 조회")
    @GetMapping("/number/{applicationNumber}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicationResponse> getByApplicationNumber(@PathVariable String applicationNumber) {
        return ApiResponse.success(applicationService.getByApplicationNumber(applicationNumber));
    }

    @Operation(summary = "채용공고별 지원서 목록")
    @GetMapping("/job/{jobPostingId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicationResponse>> getByJobPostingId(
            @PathVariable UUID jobPostingId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicationService.getByJobPostingId(jobPostingId, pageable));
    }

    @Operation(summary = "지원자별 지원서 목록")
    @GetMapping("/applicant/{applicantId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicationResponse>> getByApplicantId(
            @PathVariable UUID applicantId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicationService.getByApplicantId(applicantId, pageable));
    }

    @Operation(summary = "상태별 지원서 목록")
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicationResponse>> getByStatus(
            @PathVariable ApplicationStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicationService.getByStatus(status, pageable));
    }

    @Operation(summary = "단계별 지원서 목록")
    @GetMapping("/stage/{stage}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicationResponse>> getByCurrentStage(
            @PathVariable String stage,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicationService.getByCurrentStage(stage, pageable));
    }

    @Operation(summary = "지원서 요약")
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicationSummaryResponse> getSummary() {
        return ApiResponse.success(applicationService.getSummary());
    }

    @Operation(summary = "서류 심사")
    @PostMapping("/{id}/screen")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApplicationResponse> screen(
            @PathVariable UUID id,
            @Valid @RequestBody ScreenApplicationRequest request) {
        return ApiResponse.success(applicationService.screen(id, request));
    }

    @Operation(summary = "불합격 처리")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApplicationResponse> reject(
            @PathVariable UUID id,
            @RequestParam String reason) {
        return ApiResponse.success(applicationService.reject(id, reason));
    }

    @Operation(summary = "지원 취소")
    @PostMapping("/{id}/withdraw")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicationResponse> withdraw(@PathVariable UUID id) {
        return ApiResponse.success(applicationService.withdraw(id));
    }

    @Operation(summary = "채용 확정")
    @PostMapping("/{id}/hire")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApplicationResponse> hire(@PathVariable UUID id) {
        return ApiResponse.success(applicationService.hire(id));
    }

    @Operation(summary = "다음 단계로 이동")
    @PostMapping("/{id}/next-stage")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApplicationResponse> moveToNextStage(
            @PathVariable UUID id,
            @RequestParam String stageName,
            @RequestParam int order) {
        return ApiResponse.success(applicationService.moveToNextStage(id, stageName, order));
    }
}
