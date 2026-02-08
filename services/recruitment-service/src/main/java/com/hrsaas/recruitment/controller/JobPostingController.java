package com.hrsaas.recruitment.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.domain.dto.request.CreateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.request.UpdateJobPostingRequest;
import com.hrsaas.recruitment.domain.dto.response.ApplicationStageCountResponse;
import com.hrsaas.recruitment.domain.dto.response.JobPostingResponse;
import com.hrsaas.recruitment.domain.dto.response.JobPostingSummaryResponse;
import com.hrsaas.recruitment.domain.entity.JobStatus;
import com.hrsaas.recruitment.service.ApplicationService;
import com.hrsaas.recruitment.service.JobPostingService;
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

import java.util.List;
import java.util.UUID;

/**
 * 채용공고 컨트롤러
 */
@Tag(name = "Job Posting", description = "채용공고 관리 API")
@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService jobPostingService;
    private final ApplicationService applicationService;

    @Operation(summary = "채용공고 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<JobPostingResponse> create(@Valid @RequestBody CreateJobPostingRequest request) {
        return ApiResponse.success(jobPostingService.create(request));
    }

    @Operation(summary = "채용공고 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<JobPostingResponse> getById(@PathVariable UUID id) {
        jobPostingService.incrementViewCount(id);
        return ApiResponse.success(jobPostingService.getById(id));
    }

    @Operation(summary = "채용 코드로 조회")
    @GetMapping("/code/{jobCode}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<JobPostingResponse> getByJobCode(@PathVariable String jobCode) {
        return ApiResponse.success(jobPostingService.getByJobCode(jobCode));
    }

    @Operation(summary = "전체 채용공고 목록")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<JobPostingResponse>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.getAll(pageable));
    }

    @Operation(summary = "상태별 채용공고 목록")
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<JobPostingResponse>> getByStatus(
            @PathVariable JobStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.getByStatus(status, pageable));
    }

    @Operation(summary = "활성 채용공고 목록 (공개)")
    @GetMapping("/public/active")
    public ApiResponse<Page<JobPostingResponse>> getActivePostings(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.getActivePostings(pageable));
    }

    @Operation(summary = "부서별 채용공고 목록")
    @GetMapping("/department/{departmentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<JobPostingResponse>> getByDepartmentId(
            @PathVariable UUID departmentId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.getByDepartmentId(departmentId, pageable));
    }

    @Operation(summary = "담당자별 채용공고 목록")
    @GetMapping("/recruiter/{recruiterId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<JobPostingResponse>> getByRecruiterId(
            @PathVariable UUID recruiterId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.getByRecruiterId(recruiterId, pageable));
    }

    @Operation(summary = "채용공고 검색 (공개)")
    @GetMapping("/public/search")
    public ApiResponse<Page<JobPostingResponse>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(jobPostingService.search(keyword, pageable));
    }

    @Operation(summary = "채용공고 요약")
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<JobPostingSummaryResponse> getSummary() {
        return ApiResponse.success(jobPostingService.getSummary());
    }

    @Operation(summary = "채용공고별 단계별 지원서 집계")
    @GetMapping("/{id}/applications/stages")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ApplicationStageCountResponse>> getApplicationStages(@PathVariable UUID id) {
        return ApiResponse.success(applicationService.getStageCountsByJob(id));
    }

    @Operation(summary = "채용공고 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<JobPostingResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateJobPostingRequest request) {
        return ApiResponse.success(jobPostingService.update(id, request));
    }

    @Operation(summary = "채용공고 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public void delete(@PathVariable UUID id) {
        jobPostingService.delete(id);
    }

    @Operation(summary = "채용공고 게시")
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<JobPostingResponse> publish(@PathVariable UUID id) {
        return ApiResponse.success(jobPostingService.publish(id));
    }

    @Operation(summary = "채용공고 마감")
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<JobPostingResponse> close(@PathVariable UUID id) {
        return ApiResponse.success(jobPostingService.close(id));
    }

    @Operation(summary = "채용공고 완료")
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<JobPostingResponse> complete(@PathVariable UUID id) {
        return ApiResponse.success(jobPostingService.complete(id));
    }
}
