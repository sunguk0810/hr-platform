package com.hrsaas.recruitment.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.domain.dto.request.CreateApplicantRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicantResponse;
import com.hrsaas.recruitment.service.ApplicantService;
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
 * 지원자 컨트롤러
 */
@Tag(name = "Applicant", description = "지원자 관리 API")
@RestController
@RequestMapping("/api/v1/applicants")
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicantService applicantService;

    @Operation(summary = "지원자 등록 (공개)")
    @PostMapping("/public")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApplicantResponse> create(@Valid @RequestBody CreateApplicantRequest request) {
        return ApiResponse.success(applicantService.create(request));
    }

    @Operation(summary = "지원자 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicantResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(applicantService.getById(id));
    }

    @Operation(summary = "이메일로 조회")
    @GetMapping("/email/{email}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicantResponse> getByEmail(@PathVariable String email) {
        return ApiResponse.success(applicantService.getByEmail(email));
    }

    @Operation(summary = "전체 지원자 목록")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicantResponse>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicantService.getAll(pageable));
    }

    @Operation(summary = "지원자 검색")
    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<ApplicantResponse>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicantService.search(keyword, pageable));
    }

    @Operation(summary = "블랙리스트 지원자 목록")
    @GetMapping("/blacklisted")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Page<ApplicantResponse>> getBlacklisted(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(applicantService.getBlacklisted(pageable));
    }

    @Operation(summary = "지원자 정보 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApplicantResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateApplicantRequest request) {
        return ApiResponse.success(applicantService.update(id, request));
    }

    @Operation(summary = "지원자 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public void delete(@PathVariable UUID id) {
        applicantService.delete(id);
    }

    @Operation(summary = "블랙리스트 등록")
    @PostMapping("/{id}/blacklist")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> blacklist(
            @PathVariable UUID id,
            @RequestParam String reason) {
        applicantService.blacklist(id, reason);
        return ApiResponse.success(null);
    }

    @Operation(summary = "블랙리스트 해제")
    @PostMapping("/{id}/unblacklist")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Void> unblacklist(@PathVariable UUID id) {
        applicantService.unblacklist(id);
        return ApiResponse.success(null);
    }
}
