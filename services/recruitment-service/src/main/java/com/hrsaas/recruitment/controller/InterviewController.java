package com.hrsaas.recruitment.controller;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.recruitment.domain.dto.request.*;
import com.hrsaas.recruitment.domain.dto.response.InterviewResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewScoreResponse;
import com.hrsaas.recruitment.domain.dto.response.InterviewSummaryResponse;
import com.hrsaas.recruitment.domain.entity.InterviewStatus;
import com.hrsaas.recruitment.service.InterviewService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 면접 컨트롤러
 */
@Tag(name = "Interview", description = "면접 관리 API")
@RestController
@RequestMapping("/api/v1/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @Operation(summary = "면접 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> create(@Valid @RequestBody CreateInterviewRequest request) {
        return ApiResponse.success(interviewService.create(request));
    }

    @Operation(summary = "면접 상세 조회")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<InterviewResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(interviewService.getById(id));
    }

    @Operation(summary = "지원서별 면접 목록")
    @GetMapping("/application/{applicationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InterviewResponse>> getByApplicationId(@PathVariable UUID applicationId) {
        return ApiResponse.success(interviewService.getByApplicationId(applicationId));
    }

    @Operation(summary = "상태별 면접 목록")
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<InterviewResponse>> getByStatus(
            @PathVariable InterviewStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(interviewService.getByStatus(status, pageable));
    }

    @Operation(summary = "날짜별 면접 목록")
    @GetMapping("/date/{date}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InterviewResponse>> getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(interviewService.getByDate(date));
    }

    @Operation(summary = "오늘 예정 면접")
    @GetMapping("/today")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InterviewResponse>> getTodayInterviews() {
        return ApiResponse.success(interviewService.getTodayInterviews());
    }

    @Operation(summary = "면접 요약")
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<InterviewSummaryResponse> getSummary() {
        return ApiResponse.success(interviewService.getSummary());
    }

    @Operation(summary = "내 면접 목록")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<InterviewResponse>> getMyInterviews(@PageableDefault(size = 20) Pageable pageable) {
        UUID interviewerId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(interviewService.getMyInterviews(interviewerId, pageable));
    }

    @Operation(summary = "면접 일정 확인(확정)")
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> confirm(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleInterviewRequest request) {
        return ApiResponse.success(interviewService.confirm(id, request));
    }

    @Operation(summary = "면접 일정 확정")
    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> schedule(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleInterviewRequest request) {
        return ApiResponse.success(interviewService.schedule(id, request));
    }

    @Operation(summary = "면접 시작")
    @PostMapping("/{id}/start")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<InterviewResponse> start(@PathVariable UUID id) {
        return ApiResponse.success(interviewService.start(id));
    }

    @Operation(summary = "면접 완료")
    @PostMapping("/{id}/complete")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<InterviewResponse> complete(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteInterviewRequest request) {
        return ApiResponse.success(interviewService.complete(id, request));
    }

    @Operation(summary = "면접 취소")
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> cancel(@PathVariable UUID id) {
        return ApiResponse.success(interviewService.cancel(id));
    }

    @Operation(summary = "면접 연기")
    @PostMapping("/{id}/postpone")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> postpone(@PathVariable UUID id) {
        return ApiResponse.success(interviewService.postpone(id));
    }

    @Operation(summary = "불참 처리")
    @PostMapping("/{id}/no-show")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<InterviewResponse> markNoShow(@PathVariable UUID id) {
        return ApiResponse.success(interviewService.markNoShow(id));
    }

    @Operation(summary = "면접 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public void delete(@PathVariable UUID id) {
        interviewService.delete(id);
    }

    @Operation(summary = "면접 평가 등록")
    @PostMapping("/{interviewId}/scores")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<InterviewScoreResponse> addScore(
            @PathVariable UUID interviewId,
            @Valid @RequestBody CreateInterviewScoreRequest request) {
        return ApiResponse.success(interviewService.addScore(interviewId, request));
    }

    @Operation(summary = "면접 평가 목록")
    @GetMapping("/{interviewId}/scores")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InterviewScoreResponse>> getScores(@PathVariable UUID interviewId) {
        return ApiResponse.success(interviewService.getScores(interviewId));
    }

    @Operation(summary = "내 면접 평가 조회")
    @GetMapping("/{interviewId}/scores/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<InterviewScoreResponse>> getMyScores(@PathVariable UUID interviewId) {
        UUID interviewerId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(interviewService.getMyScore(interviewId, interviewerId));
    }

    @Operation(summary = "면접 평균 점수")
    @GetMapping("/{interviewId}/average-score")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Double> getAverageScore(@PathVariable UUID interviewId) {
        return ApiResponse.success(interviewService.getAverageScore(interviewId));
    }
}
