package com.hrsaas.approval.service.impl;

import com.hrsaas.approval.config.ApprovalStateMachineFactory;
import com.hrsaas.approval.domain.dto.request.BatchApprovalRequest;
import com.hrsaas.approval.domain.dto.request.CreateApprovalRequest;
import com.hrsaas.approval.domain.dto.request.ProcessApprovalRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalDocumentResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalHistoryResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalStatisticsResponse;
import com.hrsaas.approval.domain.dto.response.ApprovalSummaryResponse;
import com.hrsaas.approval.domain.dto.response.BatchApprovalResponse;
import com.hrsaas.approval.domain.entity.*;
import com.hrsaas.approval.domain.event.ApprovalCompletedEvent;
import com.hrsaas.approval.domain.event.ApprovalSubmittedEvent;
import com.hrsaas.approval.repository.ApprovalDocumentRepository;
import com.hrsaas.approval.service.ApprovalService;
import com.hrsaas.approval.statemachine.ApprovalEvent;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.statemachine.StateMachine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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

        // APR-G06: 자기결재 방지 — 기안자가 결재선에 포함될 수 없음
        validateNoSelfApproval(drafterId, request.getApprovalLines());

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
            .deadlineAt(request.getDeadlineAt())
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
        try {
            ApprovalDocumentResponse response = processInternal(documentId, approverId, request);
            documentRepository.flush(); // Force flush to trigger version check and catch OptimisticLockingFailureException
            return response;
        } catch (OptimisticLockingFailureException e) {
            throw new BusinessException("APV_005", "다른 사용자가 문서를 수정했습니다. 다시 시도해주세요.");
        }
    }

    private ApprovalDocumentResponse processInternal(UUID documentId, UUID approverId, ProcessApprovalRequest request) {
        ApprovalDocument document = findById(documentId);

        ApprovalLine currentLine = document.getApprovalLines().stream()
            .filter(l -> l.getStatus() == ApprovalLineStatus.ACTIVE)
            .filter(l -> l.getApproverId().equals(approverId) ||
                        (l.getDelegateId() != null && l.getDelegateId().equals(approverId)))
            .findFirst()
            .orElseThrow(() -> new ForbiddenException("APV_002", "결재 권한이 없습니다"));

        ApprovalStatus fromStatus = document.getStatus();

        // Process the line action (approve, reject, agree, delegate, return, direct_approve)
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
            case RETURN -> {
                // APR-G03: 반송 — DRAFT로 복원, 결재선 초기화
                StateMachine<ApprovalStatus, ApprovalEvent> returnSm = approvalStateMachineFactory.create(document);
                boolean returnAccepted = approvalStateMachineFactory.sendEvent(returnSm, ApprovalEvent.RETURN_LINE);
                if (!returnAccepted) {
                    throw new IllegalStateException("Cannot return document in current state: " + document.getStatus());
                }
                document.setStatus(returnSm.getState().getId());

                ApprovalHistory returnHistory = ApprovalHistory.builder()
                    .actorId(approverId)
                    .actorName(currentLine.getApproverName())
                    .actionType(ApprovalActionType.RETURN)
                    .fromStatus(fromStatus)
                    .toStatus(document.getStatus())
                    .comment(request.getComment())
                    .build();
                document.addHistory(returnHistory);

                ApprovalDocument returnSaved = documentRepository.save(document);
                log.info("Approval returned to draft: documentId={}, returnCount={}", documentId, returnSaved.getReturnCount());
                return ApprovalDocumentResponse.from(returnSaved);
            }
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
            case RETURN -> ApprovalEvent.RETURN_LINE;
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
        return documentRepository.findByIdWithLinesAndHistories(id)
            .orElseThrow(() -> new NotFoundException("APV_001", "결재 문서를 찾을 수 없습니다: " + id));
    }

    @Override
    public ApprovalStatisticsResponse getStatistics() {
        UUID tenantId = TenantContext.getCurrentTenant();
        ZoneId zone = ZoneId.systemDefault();

        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        Instant currentStart = currentMonth.atDay(1).atStartOfDay(zone).toInstant();
        Instant currentEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();
        Instant previousStart = previousMonth.atDay(1).atStartOfDay(zone).toInstant();
        Instant previousEnd = currentStart;

        BigDecimal avgCurrent = calculateAvgProcessingTime(
            documentRepository.findCompletedBetween(tenantId, currentStart, currentEnd));
        BigDecimal avgPrevious = calculateAvgProcessingTime(
            documentRepository.findCompletedBetween(tenantId, previousStart, previousEnd));

        return ApprovalStatisticsResponse.builder()
            .avgProcessingTimeHours(avgCurrent)
            .previousAvgProcessingTimeHours(avgPrevious)
            .build();
    }

    private BigDecimal calculateAvgProcessingTime(List<ApprovalDocument> documents) {
        if (documents.isEmpty()) return BigDecimal.ZERO;

        long totalHours = documents.stream()
            .filter(d -> d.getSubmittedAt() != null && d.getCompletedAt() != null)
            .mapToLong(d -> Duration.between(d.getSubmittedAt(), d.getCompletedAt()).toHours())
            .sum();

        long count = documents.stream()
            .filter(d -> d.getSubmittedAt() != null && d.getCompletedAt() != null)
            .count();

        if (count == 0) return BigDecimal.ZERO;

        return BigDecimal.valueOf(totalHours)
            .divide(BigDecimal.valueOf(count), 1, RoundingMode.HALF_UP);
    }

    /**
     * APR-G01: 결재선 미리보기 — 실제 저장 없이 결재선 구성 확인
     */
    @Override
    public ApprovalDocumentResponse preview(CreateApprovalRequest request, UUID drafterId, String drafterName,
                                            UUID drafterDepartmentId, String drafterDepartmentName) {
        validateNoSelfApproval(drafterId, request.getApprovalLines());

        ApprovalDocument previewDoc = ApprovalDocument.builder()
            .documentNumber("PREVIEW")
            .title(request.getTitle())
            .content(request.getContent())
            .documentType(request.getDocumentType())
            .drafterId(drafterId)
            .drafterName(drafterName)
            .drafterDepartmentId(drafterDepartmentId)
            .drafterDepartmentName(drafterDepartmentName)
            .referenceType(request.getReferenceType())
            .referenceId(request.getReferenceId())
            .deadlineAt(request.getDeadlineAt())
            .build();

        request.getApprovalLines().forEach(lineRequest -> {
            ApprovalLine line = ApprovalLine.builder()
                .approverId(lineRequest.getApproverId())
                .approverName(lineRequest.getApproverName())
                .approverPosition(lineRequest.getApproverPosition())
                .approverDepartmentName(lineRequest.getApproverDepartmentName())
                .lineType(lineRequest.getLineType())
                .build();
            previewDoc.addApprovalLine(line);
        });

        return ApprovalDocumentResponse.from(previewDoc);
    }

    /**
     * APR-G14: 일괄 결재 처리
     */
    @Override
    @Transactional
    public BatchApprovalResponse batchProcess(UUID approverId, BatchApprovalRequest request) {
        List<BatchApprovalResponse.BatchItemResult> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (UUID documentId : request.getDocumentIds()) {
            try {
                ProcessApprovalRequest processRequest = new ProcessApprovalRequest();
                processRequest.setActionType(request.getActionType());
                processRequest.setComment(request.getComment());
                process(documentId, approverId, processRequest);
                results.add(BatchApprovalResponse.BatchItemResult.builder()
                    .documentId(documentId)
                    .success(true)
                    .build());
                successCount++;
            } catch (Exception e) {
                log.warn("Batch approval failed for document: {}", documentId, e);
                results.add(BatchApprovalResponse.BatchItemResult.builder()
                    .documentId(documentId)
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build());
                failureCount++;
            }
        }

        return BatchApprovalResponse.builder()
            .totalRequested(request.getDocumentIds().size())
            .successCount(successCount)
            .failureCount(failureCount)
            .results(results)
            .build();
    }

    /**
     * APR-G06: 자기결재 방지 검증
     */
    private void validateNoSelfApproval(UUID drafterId, List<com.hrsaas.approval.domain.dto.request.ApprovalLineRequest> approvalLines) {
        boolean selfApproval = approvalLines.stream()
            .anyMatch(line -> drafterId.equals(line.getApproverId()));
        if (selfApproval) {
            throw new BusinessException("APV_004", "자기결재는 허용되지 않습니다. 기안자가 결재선에 포함될 수 없습니다.");
        }
    }

    private String generateDocumentNumber(UUID tenantId, String documentType) {
        String prefix = documentType.toUpperCase() + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        String maxNumber = documentRepository.findMaxDocumentNumberByPrefix(tenantId, prefix).orElse(prefix + "0000");
        int nextNumber = Integer.parseInt(maxNumber.substring(maxNumber.length() - 4)) + 1;
        return prefix + String.format("%04d", nextNumber);
    }

    @Override
    public java.util.Map<UUID, Long> getDepartmentApprovalCounts(List<UUID> departmentIds) {
        if (departmentIds == null || departmentIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }

        UUID tenantId = TenantContext.getCurrentTenant();
        List<ApprovalStatus> activeStatuses = List.of(ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS);

        List<Object[]> results = documentRepository.countActiveApprovalsByDepartments(tenantId, departmentIds, activeStatuses);

        java.util.Map<UUID, Long> countMap = new java.util.HashMap<>();
        // Initialize map with 0 for all requested departments
        departmentIds.forEach(id -> countMap.put(id, 0L));

        // Update with actual counts
        for (Object[] result : results) {
            UUID departmentId = (UUID) result[0];
            Long count = (Long) result[1];
            countMap.put(departmentId, count);
        }

        return countMap;
    }
}
