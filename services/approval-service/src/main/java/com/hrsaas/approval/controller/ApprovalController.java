package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ApprovalDocumentResponse> create(
            @Valid @RequestBody CreateApprovalRequest request,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-Department-ID", required = false) UUID departmentId,
            @RequestHeader(value = "X-Department-Name", required = false) String departmentName) {
        return ApiResponse.success(approvalService.create(request, userId, userName, departmentId, departmentName));
    }

    @GetMapping("/{id}")
    public ApiResponse<ApprovalDocumentResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(approvalService.getById(id));
    }

    @GetMapping("/document-number/{documentNumber}")
    public ApiResponse<ApprovalDocumentResponse> getByDocumentNumber(@PathVariable String documentNumber) {
        return ApiResponse.success(approvalService.getByDocumentNumber(documentNumber));
    }

    @GetMapping("/my-drafts")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getMyDrafts(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getMyDrafts(userId, pageable));
    }

    @GetMapping("/pending")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getPendingApprovals(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getPendingApprovals(userId, pageable));
    }

    @GetMapping("/processed")
    public ApiResponse<PageResponse<ApprovalDocumentResponse>> getProcessedApprovals(
            @RequestHeader("X-User-ID") UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(approvalService.getProcessedApprovals(userId, pageable));
    }

    @GetMapping("/pending/count")
    public ApiResponse<Long> countPendingApprovals(@RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.countPendingApprovals(userId));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<ApprovalDocumentResponse> submit(@PathVariable UUID id) {
        return ApiResponse.success(approvalService.submit(id));
    }

    @PostMapping("/{id}/process")
    public ApiResponse<ApprovalDocumentResponse> process(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId,
            @Valid @RequestBody ProcessApprovalRequest request) {
        return ApiResponse.success(approvalService.process(id, userId, request));
    }

    @PostMapping("/{id}/recall")
    public ApiResponse<ApprovalDocumentResponse> recall(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.recall(id, userId));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<ApprovalDocumentResponse> cancel(
            @PathVariable UUID id,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(approvalService.cancel(id, userId));
    }
}
