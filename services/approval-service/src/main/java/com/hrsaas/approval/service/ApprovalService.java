package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalHistoryResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalStatisticsResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalSummaryResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ApprovalService {

    ApprovalDocumentResponse create(CreateApprovalRequest request, UUID drafterId, String drafterName,
                                    UUID drafterDepartmentId, String drafterDepartmentName);

    ApprovalDocumentResponse getById(UUID id);

    ApprovalDocumentResponse getByDocumentNumber(String documentNumber);

    PageResponse<ApprovalDocumentResponse> getMyDrafts(UUID drafterId, Pageable pageable);

    PageResponse<ApprovalDocumentResponse> getPendingApprovals(UUID approverId, Pageable pageable);

    PageResponse<ApprovalDocumentResponse> getProcessedApprovals(UUID approverId, Pageable pageable);

    PageResponse<ApprovalDocumentResponse> search(String status, String type, UUID requesterId, Pageable pageable);

    long countPendingApprovals(UUID approverId);

    ApprovalSummaryResponse getSummary(UUID userId);

    List<ApprovalHistoryResponse> getHistory(UUID documentId);

    ApprovalDocumentResponse submit(UUID documentId);

    ApprovalDocumentResponse process(UUID documentId, UUID approverId, ProcessApprovalRequest request);

    ApprovalDocumentResponse approve(UUID documentId, UUID approverId, String comment);

    ApprovalDocumentResponse reject(UUID documentId, UUID approverId, String reason);

    ApprovalDocumentResponse recall(UUID documentId, UUID drafterId);

    ApprovalDocumentResponse cancel(UUID documentId, UUID drafterId);

    /**
     * 결재 처리 시간 통계 (대시보드 Statistics 위젯용)
     * 이번 달 vs 지난 달 평균 결재 처리 시간 비교
     */
    ApprovalStatisticsResponse getStatistics();
}
