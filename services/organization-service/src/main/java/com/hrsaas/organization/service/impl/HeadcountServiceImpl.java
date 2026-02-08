package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.client.ApprovalClient;
import com.hrsaas.organization.client.dto.ApprovalResponse;
import com.hrsaas.organization.client.dto.CreateApprovalRequest;
import com.hrsaas.organization.domain.entity.HeadcountHistory;
import com.hrsaas.organization.repository.HeadcountHistoryRepository;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.CreateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountPlanRequest;
import com.hrsaas.organization.domain.dto.request.UpdateHeadcountRequestRequest;
import com.hrsaas.organization.domain.dto.response.HeadcountPlanResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountRequestResponse;
import com.hrsaas.organization.domain.dto.response.HeadcountSummaryResponse;
import com.hrsaas.organization.domain.entity.HeadcountPlan;
import com.hrsaas.organization.domain.entity.HeadcountRequest;
import com.hrsaas.organization.domain.entity.HeadcountRequestStatus;
import com.hrsaas.organization.repository.HeadcountPlanRepository;
import com.hrsaas.organization.repository.HeadcountRequestRepository;
import com.hrsaas.organization.service.HeadcountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HeadcountServiceImpl implements HeadcountService {

    private final HeadcountPlanRepository headcountPlanRepository;
    private final HeadcountRequestRepository headcountRequestRepository;
    private final HeadcountHistoryRepository headcountHistoryRepository;
    private final ApprovalClient approvalClient;

    // Plan operations

    @Override
    @Transactional
    public HeadcountPlanResponse createPlan(CreateHeadcountPlanRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (headcountPlanRepository.existsByTenantIdAndYearAndDepartmentId(
                tenantId, request.getYear(), request.getDepartmentId())) {
            throw new DuplicateException("ORG_008",
                "해당 연도와 부서의 정현원 계획이 이미 존재합니다.");
        }

        HeadcountPlan plan = HeadcountPlan.builder()
            .year(request.getYear())
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .plannedCount(request.getPlannedCount())
            .currentCount(request.getCurrentCount())
            .notes(request.getNotes())
            .build();

        HeadcountPlan saved = headcountPlanRepository.save(plan);

        // G13: Record history
        recordPlanHistory(saved.getId(), "PLAN_CREATED", null,
            "{\"plannedCount\":" + saved.getPlannedCount() + ",\"departmentName\":\"" + saved.getDepartmentName() + "\"}");

        log.info("Headcount plan created: id={}, year={}, departmentId={}",
                 saved.getId(), saved.getYear(), saved.getDepartmentId());

        return HeadcountPlanResponse.from(saved);
    }

    @Override
    public HeadcountPlanResponse getPlanById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountPlan plan = findPlanByIdAndTenantId(id, tenantId);
        return HeadcountPlanResponse.from(plan);
    }

    @Override
    public List<HeadcountPlanResponse> getPlansByYear(Integer year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<HeadcountPlan> plans = headcountPlanRepository.findByTenantIdAndYear(tenantId, year);
        return plans.stream()
            .map(HeadcountPlanResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public HeadcountPlanResponse updatePlan(UUID id, UpdateHeadcountPlanRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountPlan plan = findPlanByIdAndTenantId(id, tenantId);

        String prevValue = "{\"plannedCount\":" + plan.getPlannedCount() + "}";
        plan.update(request.getPlannedCount(), request.getNotes());
        String newValue = "{\"plannedCount\":" + plan.getPlannedCount() + "}";

        HeadcountPlan saved = headcountPlanRepository.save(plan);

        // G13: Record history
        recordPlanHistory(saved.getId(), "PLAN_UPDATED", prevValue, newValue);

        log.info("Headcount plan updated: id={}", id);

        return HeadcountPlanResponse.from(saved);
    }

    @Override
    @Transactional
    public void deletePlan(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountPlan plan = findPlanByIdAndTenantId(id, tenantId);
        headcountPlanRepository.delete(plan);
        log.info("Headcount plan deleted: id={}", id);
    }

    // Request operations

    @Override
    @Transactional
    public HeadcountRequestResponse createRequest(CreateHeadcountRequestRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        HeadcountRequest headcountRequest = HeadcountRequest.builder()
            .departmentId(request.getDepartmentId())
            .departmentName(request.getDepartmentName())
            .type(request.getType())
            .requestCount(request.getRequestCount())
            .gradeId(request.getGradeId())
            .gradeName(request.getGradeName())
            .positionId(request.getPositionId())
            .positionName(request.getPositionName())
            .reason(request.getReason())
            .effectiveDate(request.getEffectiveDate())
            .requesterId(currentUser != null ? currentUser.getUserId() : null)
            .requesterName(currentUser != null ? currentUser.getUsername() : null)
            .build();

        if (Boolean.TRUE.equals(request.getSubmit())) {
            headcountRequest.submit();
        }

        HeadcountRequest saved = headcountRequestRepository.save(headcountRequest);

        log.info("Headcount request created: id={}, type={}", saved.getId(), saved.getType());

        return HeadcountRequestResponse.from(saved);
    }

    @Override
    public HeadcountRequestResponse getRequestById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);
        return HeadcountRequestResponse.from(request);
    }

    @Override
    public Page<HeadcountRequestResponse> getAllRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<HeadcountRequest> requests = headcountRequestRepository.findAllByTenantId(tenantId, pageable);
        return requests.map(HeadcountRequestResponse::from);
    }

    @Override
    public List<HeadcountRequestResponse> getRequestsByStatus(HeadcountRequestStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<HeadcountRequest> requests = headcountRequestRepository.findByTenantIdAndStatus(tenantId, status);
        return requests.stream()
            .map(HeadcountRequestResponse::from)
            .toList();
    }

    @Override
    public List<HeadcountRequestResponse> getRequestsByDepartment(UUID departmentId) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<HeadcountRequest> requests = headcountRequestRepository.findByTenantIdAndDepartmentId(tenantId, departmentId);
        return requests.stream()
            .map(HeadcountRequestResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public HeadcountRequestResponse updateRequest(UUID id, UpdateHeadcountRequestRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest headcountRequest = findRequestByIdAndTenantId(id, tenantId);

        if (!headcountRequest.isDraft()) {
            throw new ValidationException("ORG_009", "초안 상태의 요청만 수정할 수 있습니다.");
        }

        headcountRequest.update(
            request.getType(),
            request.getRequestCount(),
            request.getGradeId(),
            request.getGradeName(),
            request.getPositionId(),
            request.getPositionName(),
            request.getReason(),
            request.getEffectiveDate()
        );

        if (Boolean.TRUE.equals(request.getSubmit())) {
            headcountRequest.submit();
        }

        HeadcountRequest saved = headcountRequestRepository.save(headcountRequest);

        log.info("Headcount request updated: id={}", id);

        return HeadcountRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public void deleteRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isDraft()) {
            throw new ValidationException("ORG_009", "초안 상태의 요청만 삭제할 수 있습니다.");
        }

        headcountRequestRepository.delete(request);
        log.info("Headcount request deleted: id={}", id);
    }

    @Override
    @Transactional
    public void submitRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isDraft()) {
            throw new ValidationException("ORG_009", "초안 상태의 요청만 제출할 수 있습니다.");
        }

        // G03: Create approval via approval-service
        try {
            String title = request.getDepartmentName() + " 정원 변경 요청 (" + request.getType() + " " + request.getRequestCount() + "명)";
            String content = "부서: " + request.getDepartmentName() + "\n유형: " + request.getType()
                + "\n인원: " + request.getRequestCount() + "\n사유: " + request.getReason();
            ApprovalResponse resp = approvalClient.createApproval(
                CreateApprovalRequest.of("HEADCOUNT_REQUEST", id, title, content)
            ).getData();
            request.submit();
            if (resp != null && resp.getApprovalId() != null) {
                request.setApprovalId(resp.getApprovalId());
            }
        } catch (Exception e) {
            log.warn("Approval service call failed, submitting without approval integration: {}", e.getMessage());
            request.submit();
        }
        headcountRequestRepository.save(request);

        log.info("Headcount request submitted: id={}", id);
    }

    @Override
    @Transactional
    public void cancelRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("ORG_009", "대기 상태의 요청만 취소할 수 있습니다.");
        }

        // G03: Cancel approval
        if (request.getApprovalId() != null) {
            try {
                approvalClient.cancelApproval(request.getApprovalId());
            } catch (Exception e) {
                log.warn("Failed to cancel approval {}: {}", request.getApprovalId(), e.getMessage());
            }
        }

        request.cancel();
        headcountRequestRepository.save(request);

        log.info("Headcount request cancelled: id={}", id);
    }

    @Override
    @Transactional
    public HeadcountPlanResponse approvePlan(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountPlan plan = findPlanByIdAndTenantId(id, tenantId);

        // Plan approval logic - mark as approved/finalized
        log.info("Headcount plan approved: id={}", id);

        return HeadcountPlanResponse.from(plan);
    }

    @Override
    @Transactional
    public HeadcountRequestResponse approveRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("ORG_009", "대기 상태의 요청만 승인할 수 있습니다.");
        }

        request.approve(null); // approvalId can be set later via approval workflow

        // Update related headcount plan's approved count
        HeadcountPlan plan = headcountPlanRepository
            .findByTenantIdAndYearAndDepartmentId(tenantId, java.time.LocalDate.now().getYear(), request.getDepartmentId())
            .orElse(null);
        if (plan != null) {
            plan.incrementApprovedCount(request.getRequestCount());
            headcountPlanRepository.save(plan);
        }

        HeadcountRequest saved = headcountRequestRepository.save(request);

        log.info("Headcount request approved: id={}", id);

        return HeadcountRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public HeadcountRequestResponse rejectRequest(UUID id, String reason) {
        UUID tenantId = TenantContext.getCurrentTenant();
        HeadcountRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("ORG_009", "대기 상태의 요청만 반려할 수 있습니다.");
        }

        request.reject();

        HeadcountRequest saved = headcountRequestRepository.save(request);

        log.info("Headcount request rejected: id={}, reason={}", id, reason);

        return HeadcountRequestResponse.from(saved);
    }

    @Override
    public HeadcountSummaryResponse getSummary(Integer year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<HeadcountPlan> plans = headcountPlanRepository.findByTenantIdAndYear(tenantId, year);

        int totalPlanned = 0;
        int totalCurrent = 0;
        int totalApproved = 0;

        List<HeadcountSummaryResponse.DepartmentSummary> departmentSummaries = plans.stream()
            .map(plan -> HeadcountSummaryResponse.DepartmentSummary.builder()
                .departmentId(plan.getDepartmentId())
                .departmentName(plan.getDepartmentName())
                .plannedCount(plan.getPlannedCount())
                .currentCount(plan.getCurrentCount())
                .approvedCount(plan.getApprovedCount())
                .variance(plan.getVariance())
                .availableCount(plan.getAvailableCount())
                .build())
            .toList();

        for (HeadcountPlan plan : plans) {
            totalPlanned += plan.getPlannedCount();
            totalCurrent += plan.getCurrentCount();
            totalApproved += plan.getApprovedCount();
        }

        return HeadcountSummaryResponse.builder()
            .year(year)
            .totalPlannedCount(totalPlanned)
            .totalCurrentCount(totalCurrent)
            .totalApprovedCount(totalApproved)
            .totalVariance(totalPlanned - totalCurrent)
            .departments(departmentSummaries)
            .build();
    }

    private HeadcountPlan findPlanByIdAndTenantId(UUID id, UUID tenantId) {
        return headcountPlanRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_008", "정현원 계획을 찾을 수 없습니다: " + id));
    }

    @Override
    public List<HeadcountHistory> getPlanHistory(UUID planId) {
        return headcountHistoryRepository.findByPlanIdOrderByEventDateDesc(planId);
    }

    private HeadcountRequest findRequestByIdAndTenantId(UUID id, UUID tenantId) {
        return headcountRequestRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_009", "정현원 변경 요청을 찾을 수 없습니다: " + id));
    }

    private void recordPlanHistory(UUID planId, String eventType, String prevValue, String newValue) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        HeadcountHistory history = HeadcountHistory.builder()
            .tenantId(tenantId)
            .planId(planId)
            .eventType(eventType)
            .previousValue(prevValue)
            .newValue(newValue)
            .actorId(currentUser != null ? currentUser.getUserId() : null)
            .actorName(currentUser != null ? currentUser.getUsername() : "시스템")
            .build();
        headcountHistoryRepository.save(history);
    }
}
