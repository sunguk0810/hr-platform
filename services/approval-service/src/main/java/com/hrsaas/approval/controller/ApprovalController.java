package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalHistoryResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalSummaryResponse;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
@Tag(name = "Approval", description = "결재 문서 관리 API")
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "결재 문서 생성")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> create(
            @Valid @RequestBody CreateApprovalRequest request,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-Department-ID", required = false) UUID departmentId,
            @RequestHeader(value = "X-Department-Name", required = false) String departmentName) {
        return ApiResponse.success(approvalService.create(request, userId, userName, departmentId, departmentName));
    }

    @GetMapping("/{id}")
    @Operation(summary = "결재 문서 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(approvalService.getById(id));
    }

    @GetMapping("/document-number/{documentNumber}")
    @Operation(summary = "결재 문서 번호로 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> getByDocumentNumber(@PathVariable String documentNumber) {
        return ApiResponse.success(approvalService.getByDocumentNumber(documentNumber));
    }

    @GetMapping("/my-drafts")
    @Operation(summary = "내 임시저장 문서 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getMyDrafts(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getMyDrafts(userId, pageable));
    }

    @GetMapping("/pending")
    @Operation(summary = "결재 대기 문서 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getPendingApprovals(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getPendingApprovals(userId, pageable));
    }

    @GetMapping("/processed")
    @Operation(summary = "결재 처리 완료 문서 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getProcessedApprovals(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getProcessedApprovals(userId, pageable));
    }

    @GetMapping("/pending/count")
    @Operation(summary = "결재 대기 문서 수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> countPendingApprovals(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.countPendingApprovals(userId));
    }

    @GetMapping("/summary")
    @Operation(summary = "결재 요약 정보")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalSummaryResponse> getSummary(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.getSummary(userId));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "결재 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ApprovalHistoryResponse>> getHistory(@PathVariable UUID id) {
        return ApiResponse.success(approvalService.getHistory(id));
    }

    @GetMapping
    @Operation(summary = "결재 문서 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getApprovals(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestHeader(value = "X-User-ID", required = false) UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.search(status, type, userId, pageable));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "결재 승인")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> approve(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody(required = false) Map<String, String> body) {
        String comment = body != null ? body.get("comment") : null;
        return ApiResponse.success(approvalService.approve(id, userId, comment));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "결재 반려")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> reject(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        return ApiResponse.success(approvalService.reject(id, userId, reason));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "결재 문서 제출")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> submit(@PathVariable UUID id) {
        return ApiResponse.success(approvalService.submit(id));
    }

    @PostMapping("/{id}/process")
    @Operation(summary = "결재 처리 (승인/반려/합의)")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> process(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @Valid @RequestBody ProcessApprovalRequest request) {
        return ApiResponse.success(approvalService.process(id, userId, request));
    }

    @PostMapping("/{id}/recall")
    @Operation(summary = "결재 문서 회수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> recall(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.recall(id, userId));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "결재 문서 취소")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> cancel(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.cancel(id, userId));
    }
}
