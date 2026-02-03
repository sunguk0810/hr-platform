package com.hrsaas.approval.service;

import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ApprovalService {

    ApprovalDocumentResponse create(CreateApprovalRequest request, UUID drafterId, String drafterName,
                                    UUID drafterDepartmentId, String drafterDepartmentName);

    ApprovalDocumentResponse getById(UUID id);

    ApprovalDocumentResponse getByDocumentNumber(String documentNumber);

    PageResponse<ApprovalDocumentResponse> getMyDrafts(UUID drafterId, Pageable pageable);

    PageResponse<ApprovalDocumentResponse> getPendingApprovals(UUID approverId, Pageable pageable);

    PageResponse<ApprovalDocumentResponse> getProcessedApprovals(UUID approverId, Pageable pageable);

    long countPendingApprovals(UUID approverId);

    ApprovalDocumentResponse submit(UUID documentId);

    ApprovalDocumentResponse process(UUID documentId, UUID approverId, ProcessApprovalRequest request);

    ApprovalDocumentResponse recall(UUID documentId, UUID drafterId);

    ApprovalDocumentResponse cancel(UUID documentId, UUID drafterId);
}
