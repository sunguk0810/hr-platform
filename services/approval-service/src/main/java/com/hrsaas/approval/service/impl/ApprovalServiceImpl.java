package com.hrsaas.approval.service.impl;

import com.hrsaas.approval.config.ApprovalStateMachineFactory;
import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalHistoryResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalSummaryResponse;
import com.hrsaas.approval.domain.entity.*;
import com.hrsaas.approval.domain.event.ApprovalCompletedEvent;
import com.hrsaas.approval.domain.event.ApprovalSubmittedEvent;
import com.hrsaas.approval.repository.ApprovalDocumentRepository;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.approval.statemachine.ApprovalEvent;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.statemachine.StateMachine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalDocumentRepository documentRepository;
    private final EventPublisher eventPublisher;
    private final ApprovalStateMachineFactory approvalStateMachineFactory;

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
            // Use StateMachine for immediate submission
            StateMachine<ApprovalStatus, ApprovalEvent> sm = approvalStateMachineFactory.create(saved);
            approvalStateMachineFactory.sendEvent(sm, ApprovalEvent.SUBMIT);
            saved.setStatus(sm.getState().getId());
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
    public PageResponse<ApprovalDocumentResponse> search(String status, String type, UUID requesterId, Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        ApprovalStatus approvalStatus = status != null ? ApprovalStatus.valueOf(status.toUpperCase()) : null;

        Page<ApprovalDocument> page = documentRepository.search(tenantId, approvalStatus, type, requesterId, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(ApprovalDocumentResponse::from)
            .toList());
    }

    @Override
    public ApprovalSummaryResponse getSummary(UUID userId) {
        UUID tenantId = TenantContext.getCurrentTenant();

        long pending = documentRepository.countPendingByApproverId(tenantId, userId);
        long approved = documentRepository.countByStatus(tenantId, ApprovalStatus.APPROVED);
        long rejected = documentRepository.countByStatus(tenantId, ApprovalStatus.REJECTED);
        long draft = documentRepository.countByDrafterIdAndStatus(tenantId, userId, ApprovalStatus.DRAFT);

        return ApprovalSummaryResponse.builder()
            .pending(pending)
            .approved(approved)
            .rejected(rejected)
            .draft(draft)
            .build();
    }

    @Override
    public List<ApprovalHistoryResponse> getHistory(UUID documentId) {
        ApprovalDocument document = findById(documentId);

        return document.getHistories().stream()
            .map(h -> ApprovalHistoryResponse.builder()
                .id(h.getId())
                .documentId(documentId)
                .stepOrder(h.getStepOrder())
                .action(h.getActionType().name())
                .actorId(h.getActorId())
                .actorName(h.getActorName())
                .comment(h.getComment())
                .processedAt(h.getCreatedAt())
                .build())
            .toList();
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse approve(UUID documentId, UUID approverId, String comment) {
        ProcessApprovalRequest request = new ProcessApprovalRequest();
        request.setActionType(ApprovalActionType.APPROVE);
        request.setComment(comment);
        return process(documentId, approverId, request);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse reject(UUID documentId, UUID approverId, String reason) {
        ProcessApprovalRequest request = new ProcessApprovalRequest();
        request.setActionType(ApprovalActionType.REJECT);
        request.setComment(reason);
        return process(documentId, approverId, request);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse submit(UUID documentId) {
        ApprovalDocument document = findById(documentId);

        // Use StateMachine to handle DRAFT -> IN_PROGRESS transition
        StateMachine<ApprovalStatus, ApprovalEvent> sm = approvalStateMachineFactory.create(document);
        boolean accepted = approvalStateMachineFactory.sendEvent(sm, ApprovalEvent.SUBMIT);

        if (!accepted) {
            throw new IllegalStateException("Cannot submit document in current state: " + document.getStatus());
        }

        // Sync SM state back to entity
        document.setStatus(sm.getState().getId());
        ApprovalDocument saved = documentRepository.save(document);

        eventPublisher.publish(ApprovalSubmittedEvent.of(saved));

        log.info("Approval document submitted via StateMachine: id={}, newStatus={}", documentId, saved.getStatus());
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

        // Process the line action (approve, reject, agree, delegate, direct_approve)
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
            case DIRECT_APPROVE -> {
                // 전결: 현재 라인 승인 + 이후 라인 모두 스킵
                currentLine.approveAsArbitrary(request.getComment());
                document.getApprovalLines().stream()
                    .filter(l -> l.getStatus() == ApprovalLineStatus.WAITING)
                    .forEach(l -> l.skip());
            }
            default -> throw new IllegalArgumentException("Unsupported action type: " + request.getActionType());
        }

        // Use StateMachine to handle state transitions when line is completed
        if (currentLine.isCompleted()) {
            StateMachine<ApprovalStatus, ApprovalEvent> sm = approvalStateMachineFactory.create(document);
            sm.getExtendedState().getVariables().put("completedLine", currentLine);

            ApprovalEvent smEvent = mapActionToEvent(request.getActionType(), currentLine);
            approvalStateMachineFactory.sendEvent(sm, smEvent);

            // If line was approved and all lines are done, send COMPLETE event
            if (smEvent == ApprovalEvent.APPROVE_LINE) {
                boolean allDone = document.getApprovalLines().stream()
                    .noneMatch(l -> l.getStatus() == ApprovalLineStatus.WAITING ||
                                   l.getStatus() == ApprovalLineStatus.ACTIVE);
                if (allDone) {
                    approvalStateMachineFactory.sendEvent(sm, ApprovalEvent.COMPLETE);
                }
            }

            // Sync SM state back to entity
            document.setStatus(sm.getState().getId());
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

        log.info("Approval processed via StateMachine: documentId={}, action={}, newStatus={}",
            documentId, request.getActionType(), saved.getStatus());
        return ApprovalDocumentResponse.from(saved);
    }

    /**
     * Maps an approval action type to the corresponding StateMachine event
     */
    private ApprovalEvent mapActionToEvent(ApprovalActionType actionType, ApprovalLine line) {
        return switch (actionType) {
            case APPROVE -> {
                if (line.getLineType() == ApprovalLineType.ARBITRARY) {
                    yield ApprovalEvent.ARBITRARY_APPROVE;
                }
                yield ApprovalEvent.APPROVE_LINE;
            }
            case REJECT -> ApprovalEvent.REJECT_LINE;
            case AGREE -> ApprovalEvent.AGREE_LINE;
            case DIRECT_APPROVE -> ApprovalEvent.ARBITRARY_APPROVE;
            default -> throw new IllegalArgumentException("Cannot map action to SM event: " + actionType);
        };
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse recall(UUID documentId, UUID drafterId) {
        ApprovalDocument document = findById(documentId);

        if (!document.getDrafterId().equals(drafterId)) {
            throw new ForbiddenException("APV_003", "본인이 기안한 문서만 회수할 수 있습니다");
        }

        // Use StateMachine for RECALL transition
        StateMachine<ApprovalStatus, ApprovalEvent> sm = approvalStateMachineFactory.create(document);
        boolean accepted = approvalStateMachineFactory.sendEvent(sm, ApprovalEvent.RECALL);

        if (!accepted) {
            throw new IllegalStateException("Cannot recall document in current state: " + document.getStatus());
        }

        document.setStatus(sm.getState().getId());
        ApprovalDocument saved = documentRepository.save(document);

        log.info("Approval document recalled via StateMachine: id={}", documentId);
        return ApprovalDocumentResponse.from(saved);
    }

    @Override
    @Transactional
    public ApprovalDocumentResponse cancel(UUID documentId, UUID drafterId) {
        ApprovalDocument document = findById(documentId);

        if (!document.getDrafterId().equals(drafterId)) {
            throw new ForbiddenException("APV_003", "본인이 기안한 문서만 취소할 수 있습니다");
        }

        // Use StateMachine for CANCEL transition
        StateMachine<ApprovalStatus, ApprovalEvent> sm = approvalStateMachineFactory.create(document);
        boolean accepted = approvalStateMachineFactory.sendEvent(sm, ApprovalEvent.CANCEL);

        if (!accepted) {
            throw new IllegalStateException("Cannot cancel document in current state: " + document.getStatus());
        }

        document.setStatus(sm.getState().getId());
        ApprovalDocument saved = documentRepository.save(document);

        log.info("Approval document canceled via StateMachine: id={}", documentId);
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
