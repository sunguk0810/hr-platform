package com.hrsaas.approval.controller;

import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.DashboardPendingApprovalsResponse;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard-Approval", description = "대시보드 결재 API")
public class DashboardController {

    private final ApprovalService approvalService;

    @GetMapping("/pending-approvals")
    @Operation(summary = "결재 대기 현황")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<DashboardPendingApprovalsResponse> getPendingApprovals() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();

        long total = approvalService.countPendingApprovals(userId);
        PageResponse<ApprovalDocumentResponse> pending = approvalService.getPendingApprovals(userId, PageRequest.of(0, 5));

        List<DashboardPendingApprovalsResponse.PendingApprovalItem> items = pending.getContent().stream()
            .map(DashboardPendingApprovalsResponse.PendingApprovalItem::from)
            .toList();

        return ApiResponse.success(DashboardPendingApprovalsResponse.builder()
            .total(total)
            .items(items)
            .build());
    }
}
