package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.BatchApprovalRequest;
import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.DelegateStepRequest;
import com.hrsaas.approval.domain.dto.request.DirectApproveStepRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.entity.ApprovalActionType;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalHistoryResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalStatisticsResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalSummaryResponse;
import com.hrsaas.approval.domain.dto.response.BatchApprovalResponse;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
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
            @Valid @RequestBody CreateApprovalRequest request) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        UUID userId = currentUser.getUserId();
        String userName = currentUser.getUsername();
        UUID departmentId = currentUser.getDepartmentId();
        String departmentName = currentUser.getDepartmentName();
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
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.getMyDrafts(userId, pageable));
    }

    @GetMapping("/pending")
    @Operation(summary = "결재 대기 문서 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getPendingApprovals(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.getPendingApprovals(userId, pageable));
    }

    @GetMapping("/processed")
    @Operation(summary = "결재 처리 완료 문서 목록")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getProcessedApprovals(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.getProcessedApprovals(userId, pageable));
    }

    @GetMapping("/pending/count")
    @Operation(summary = "결재 대기 문서 수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> countPendingApprovals() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.countPendingApprovals(userId));
    }

    @GetMapping("/summary")
    @Operation(summary = "결재 요약 정보")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalSummaryResponse> getSummary() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
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
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.search(status, type, userId, pageable));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "결재 승인")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        String comment = body != null ? body.get("comment") : null;
        return ApiResponse.success(approvalService.approve(id, userId, comment));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "결재 반려")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> reject(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
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
            @Valid @RequestBody ProcessApprovalRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.process(id, userId, request));
    }

    @PostMapping("/{id}/steps/{stepId}/delegate")
    @Operation(summary = "대결 (대리결재)")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> delegateStep(
            @PathVariable UUID id,
            @PathVariable UUID stepId,
            @Valid @RequestBody DelegateStepRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        ProcessApprovalRequest processRequest = ProcessApprovalRequest.builder()
                .actionType(ApprovalActionType.DELEGATE)
                .delegateId(request.getDelegateToId())
                .delegateName(request.getDelegateToName())
                .comment(request.getReason())
                .build();
        return ApiResponse.success(approvalService.process(id, userId, processRequest));
    }

    @PostMapping("/{id}/direct-approve")
    @Operation(summary = "전결 (직접 승인)")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> directApprove(
            @PathVariable UUID id,
            @RequestBody(required = false) DirectApproveStepRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        ProcessApprovalRequest processRequest = ProcessApprovalRequest.builder()
                .actionType(ApprovalActionType.DIRECT_APPROVE)
                .comment(request != null ? request.getReason() : null)
                .skipToStep(request != null ? request.getSkipToStep() : null)
                .build();
        return ApiResponse.success(approvalService.process(id, userId, processRequest));
    }

    @PostMapping("/{id}/recall")
    @Operation(summary = "결재 문서 회수")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> recall(
            @PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.recall(id, userId));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "결재 문서 취소")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> cancel(
            @PathVariable UUID id) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.cancel(id, userId));
    }

    @PostMapping("/preview")
    @Operation(summary = "결재선 미리보기")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> preview(
            @Valid @RequestBody CreateApprovalRequest request) {
        var currentUser = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(approvalService.preview(
                request,
                currentUser.getUserId(),
                currentUser.getUsername(),
                currentUser.getDepartmentId(),
                currentUser.getDepartmentName()));
    }

    @PostMapping("/batch")
    @Operation(summary = "일괄 결재 처리")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BatchApprovalResponse> batchProcess(
            @Valid @RequestBody BatchApprovalRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(approvalService.batchProcess(userId, request));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "결재 반송 (수정요청)")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApprovalDocumentResponse> returnDocument(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        String comment = body != null ? body.get("comment") : null;
        ProcessApprovalRequest processRequest = ProcessApprovalRequest.builder()
                .actionType(ApprovalActionType.RETURN)
                .comment(comment)
                .build();
        return ApiResponse.success(approvalService.process(id, userId, processRequest));
    }

    @GetMapping("/statistics")
    @Operation(summary = "결재 처리 시간 통계 (대시보드용)")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<ApprovalStatisticsResponse> getStatistics() {
        return ApiResponse.success(approvalService.getStatistics());
    }

    @PostMapping("/department-counts")
    @Operation(summary = "부서별 활성 결재 건수 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<Map<UUID, Long>> getDepartmentApprovalCounts(@RequestBody List<UUID> departmentIds) {
        return ApiResponse.success(approvalService.getDepartmentApprovalCounts(departmentIds));
    }
}
