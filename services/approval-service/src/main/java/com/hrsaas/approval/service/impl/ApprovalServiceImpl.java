package com.hrsaas.approval.service.impl;

import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.entity.*;
import com.hrsaas.approval.domain.event.ApprovalCompletedEvent;
import com.hrsaas.approval.domain.event.ApprovalSubmittedEvent;
import com.hrsaas.approval.repository.ApprovalDocumentRepository;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalDocumentRepository documentRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public ApprovalDocumentResponse create(CreateApprovalRequest request, UUID drafterId, String drafterName,
                                           UUID drafterDepartmentId, String drafterDepartmentName) {
        UUID tenantId = TenantContext.getCurrentTenant();

        ApprovalDocument document = ApprovalDocument.builder()
            .documentNumber(generateDocumentNumber(tenantId, request.getDocumentType()))
            .title(request.getTitle())
            .content(request.getContent())
            .documentType(request.getDocumentType())
            .drafterId(drafterId)
            .drafterName(drafterName)
            .drafterDepartmentId(drafterDepartmentId)
            .drafterDepartmentName(drafterDepartmentName)
            .referenceType(request.getReferenceType())
            .referenceId(request.getReferenceId())
            .build();

        request.getApprovalLines().forEach(lineRequest -> {
            ApprovalLine line = ApprovalLine.builder()
                .approverId(lineRequest.getApproverId())
                .approverName(lineRequest.getApproverName())
                .approverPosition(lineRequest.getApproverPosition())
                .approverDepartmentName(lineRequest.getApproverDepartmentName())
                .lineType(lineRequest.getLineType())
                .build();
            document.addApprovalLine(line);
        });

        ApprovalDocument saved = documentRepository.save(document);

        if (request.isSubmitImmediately()) {
            saved.submit();
            saved = documentRepository.save(saved);
            eventPublisher.publish(ApprovalSubmittedEvent.of(saved));
        }

        log.info("Approval document created: id={}, documentNumber={}", saved.getId(), saved.getDocumentNumber());
        return ApprovalDocumentResponse.from(saved);
    }

    @Override
    public ApprovalDocumentResponse getById(UUID id) {
        ApprovalDocument document = findById(id);
        return ApprovalDocumentResponse.from(document);
    }

    @Override
    public ApprovalDocumentResponse getByDocumentNumber(String documentNumber) {
        ApprovalDocument document = documentRepository.findByDocumentNumber(documentNumber)
            .orElseThrow(() -> new NotFoundException("APV_001", "결재 문서를 찾을 수 없습니다: " + documentNumber));
        return ApprovalDocumentResponse.from(document);
    }

    @Override
    public PageResponse<ApprovalDocumentResponse> getMyDrafts(UUID drafterId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<ApprovalDocument> page = documentRepository.findByDrafterId(tenantId, drafterId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(ApprovalDocumentResponse::from)
            .toList());
    }

    @Override
    public PageResponse<ApprovalDocumentResponse> getPendingApprovals(UUID approverId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<ApprovalDocument> page = documentRepository.findPendingByApproverId(tenantId, approverId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(ApprovalDocumentResponse::from)
            .toList());
    }

    @Override
    public PageResponse<ApprovalDocumentResponse> getProcessedApprovals(UUID approverId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<ApprovalDocument> page = documentRepository.findProcessedByApproverId(tenantId, approverId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(ApprovalDocumentResponse::from)
            .toList());
    }

    @Override
    public long countPendingApprovals(UUID approverId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return documentRepository.countPendingByApproverId(tenantId, approverId);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse submit(UUID documentId) {
        ApprovalDocument document = findById(documentId);
        document.submit();
        ApprovalDocument saved = documentRepository.save(document);

        eventPublisher.publish(ApprovalSubmittedEvent.of(saved));

        log.info("Approval document submitted: id={}", documentId);
        return ApprovalDocumentResponse.from(saved);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse process(UUID documentId, UUID approverId, ProcessApprovalRequest request) {
        ApprovalDocument document = findById(documentId);

        ApprovalLine currentLine = document.getApprovalLines().stream()
            .filter(l -> l.getStatus() == ApprovalLineStatus.ACTIVE)
            .filter(l -> l.getApproverId().equals(approverId) ||
                        (l.getDelegateId() != null && l.getDelegateId().equals(approverId)))
            .findFirst()
            .orElseThrow(() -> new ForbiddenException("APV_002", "결재 권한이 없습니다"));

        ApprovalStatus fromStatus = document.getStatus();

        switch (request.getActionType()) {
            case APPROVE -> {
                if (currentLine.getLineType() == ApprovalLineType.ARBITRARY) {
                    currentLine.approveAsArbitrary(request.getComment());
                } else {
                    currentLine.approve(request.getComment());
                }
            }
            case REJECT -> currentLine.reject(request.getComment());
            case AGREE -> currentLine.agree(request.getComment());
            case DELEGATE -> currentLine.delegate(request.getDelegateId(), request.getDelegateName());
            default -> throw new IllegalArgumentException("Unsupported action type: " + request.getActionType());
        }

        if (currentLine.isCompleted()) {
            document.processLineCompletion(currentLine);
        }

        ApprovalHistory history = ApprovalHistory.builder()
            .actorId(approverId)
            .actorName(currentLine.getApproverName())
            .actionType(request.getActionType())
            .fromStatus(fromStatus)
            .toStatus(document.getStatus())
            .comment(request.getComment())
            .build();
        document.addHistory(history);

        ApprovalDocument saved = documentRepository.save(document);

        if (saved.getStatus() == ApprovalStatus.APPROVED || saved.getStatus() == ApprovalStatus.REJECTED) {
            eventPublisher.publish(ApprovalCompletedEvent.of(saved));
        }

        log.info("Approval processed: documentId={}, action={}, newStatus={}",
            documentId, request.getActionType(), saved.getStatus());
        return ApprovalDocumentResponse.from(saved);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse recall(UUID documentId, UUID drafterId) {
        ApprovalDocument document = findById(documentId);

        if (!document.getDrafterId().equals(drafterId)) {
            throw new ForbiddenException("APV_003", "본인이 기안한 문서만 회수할 수 있습니다");
        }

        document.recall();
        ApprovalDocument saved = documentRepository.save(document);

        log.info("Approval document recalled: id={}", documentId);
        return ApprovalDocumentResponse.from(saved);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse cancel(UUID documentId, UUID drafterId) {
        ApprovalDocument document = findById(documentId);

        if (!document.getDrafterId().equals(drafterId)) {
            throw new ForbiddenException("APV_003", "본인이 기안한 문서만 취소할 수 있습니다");
        }

        document.cancel();
        ApprovalDocument saved = documentRepository.save(document);

        log.info("Approval document canceled: id={}", documentId);
        return ApprovalDocumentResponse.from(saved);
    }

    private ApprovalDocument findById(UUID id) {
        return documentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("APV_001", "결재 문서를 찾을 수 없습니다: " + id));
    }

    private String generateDocumentNumber(UUID tenantId, String documentType) {
        String prefix = documentType.toUpperCase() + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String maxNumber = documentRepository.findMaxDocumentNumberByPrefix(tenantId, prefix).orElse(prefix + "0000");
        int nextNumber = Integer.parseInt(maxNumber.substring(maxNumber.length() - 4)) + 1;
        return prefix + String.format("%04d", nextNumber);
    }
}
