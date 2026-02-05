package com.hrsaas.employee.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.CreateCondolencePolicyRequest;
import com.hrsaas.employee.domain.dto.request.CreateCondolenceRequest;
import com.hrsaas.employee.domain.dto.request.UpdateCondolencePolicyRequest;
import com.hrsaas.employee.domain.dto.request.UpdateCondolenceRequest;
import com.hrsaas.employee.domain.dto.response.CondolencePolicyResponse;
import com.hrsaas.employee.domain.dto.response.CondolenceRequestResponse;
import com.hrsaas.employee.domain.entity.CondolencePolicy;
import com.hrsaas.employee.domain.entity.CondolenceRequest;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
import com.hrsaas.employee.repository.CondolencePolicyRepository;
import com.hrsaas.employee.repository.CondolenceRequestRepository;
import com.hrsaas.employee.service.CondolenceService;
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
public class CondolenceServiceImpl implements CondolenceService {

    private final CondolenceRequestRepository condolenceRequestRepository;
    private final CondolencePolicyRepository condolencePolicyRepository;

    // Request operations

    @Override
    @Transactional
    public CondolenceRequestResponse createRequest(CreateCondolenceRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        // Get policy if specified, otherwise find by event type
        CondolencePolicy policy = null;
        if (request.getPolicyId() != null) {
            policy = condolencePolicyRepository.findByIdAndTenantId(request.getPolicyId(), tenantId)
                .orElseThrow(() -> new NotFoundException("EMP_010", "경조비 정책을 찾을 수 없습니다."));
        } else {
            policy = condolencePolicyRepository.findByTenantIdAndEventType(tenantId, request.getEventType())
                .orElse(null);
        }

        CondolenceRequest condolenceRequest = CondolenceRequest.builder()
            .employeeId(currentUser != null ? currentUser.getUserId() : null)
            .employeeName(currentUser != null ? currentUser.getUsername() : null)
            .departmentName(currentUser != null ? currentUser.getDepartmentName() : null)
            .policyId(policy != null ? policy.getId() : null)
            .eventType(request.getEventType())
            .eventDate(request.getEventDate())
            .description(request.getDescription())
            .relation(request.getRelation())
            .relatedPersonName(request.getRelatedPersonName())
            .amount(policy != null ? policy.getAmount() : null)
            .leaveDays(policy != null ? policy.getLeaveDays() : null)
            .build();

        CondolenceRequest saved = condolenceRequestRepository.save(condolenceRequest);

        log.info("Condolence request created: id={}, eventType={}", saved.getId(), saved.getEventType());

        return CondolenceRequestResponse.from(saved);
    }

    @Override
    public CondolenceRequestResponse getRequestById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest request = findRequestByIdAndTenantId(id, tenantId);
        return CondolenceRequestResponse.from(request);
    }

    @Override
    public Page<CondolenceRequestResponse> getAllRequests(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<CondolenceRequest> requests = condolenceRequestRepository.findAllByTenantId(tenantId, pageable);
        return requests.map(CondolenceRequestResponse::from);
    }

    @Override
    public List<CondolenceRequestResponse> getMyRequests() {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        if (currentUser == null || currentUser.getUserId() == null) {
            return List.of();
        }

        List<CondolenceRequest> requests = condolenceRequestRepository.findByTenantIdAndEmployeeId(
            tenantId, currentUser.getUserId());

        return requests.stream()
            .map(CondolenceRequestResponse::from)
            .toList();
    }

    @Override
    public List<CondolenceRequestResponse> getRequestsByStatus(CondolenceStatus status) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CondolenceRequest> requests = condolenceRequestRepository.findByTenantIdAndStatus(tenantId, status);
        return requests.stream()
            .map(CondolenceRequestResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public CondolenceRequestResponse updateRequest(UUID id, UpdateCondolenceRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest condolenceRequest = findRequestByIdAndTenantId(id, tenantId);

        if (!condolenceRequest.canBeModified()) {
            throw new ValidationException("EMP_011", "수정할 수 없는 상태입니다.");
        }

        condolenceRequest.update(
            request.getEventDate(),
            request.getDescription(),
            request.getRelation(),
            request.getRelatedPersonName()
        );

        CondolenceRequest saved = condolenceRequestRepository.save(condolenceRequest);

        log.info("Condolence request updated: id={}", id);

        return CondolenceRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public void deleteRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.canBeModified()) {
            throw new ValidationException("EMP_011", "삭제할 수 없는 상태입니다.");
        }

        condolenceRequestRepository.delete(request);
        log.info("Condolence request deleted: id={}", id);
    }

    @Override
    @Transactional
    public void cancelRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.canBeModified()) {
            throw new ValidationException("EMP_011", "취소할 수 없는 상태입니다.");
        }

        request.cancel();
        condolenceRequestRepository.save(request);

        log.info("Condolence request cancelled: id={}", id);
    }

    @Override
    @Transactional
    public CondolenceRequestResponse approveRequest(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("EMP_011", "대기 상태의 신청만 승인할 수 있습니다.");
        }

        request.approve(null); // approvalId는 결재 시스템 연동 시 설정
        CondolenceRequest saved = condolenceRequestRepository.save(request);

        log.info("Condolence request approved: id={}", id);

        return CondolenceRequestResponse.from(saved);
    }

    @Override
    @Transactional
    public CondolenceRequestResponse rejectRequest(UUID id, String reason) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolenceRequest request = findRequestByIdAndTenantId(id, tenantId);

        if (!request.isPending()) {
            throw new ValidationException("EMP_011", "대기 상태의 신청만 반려할 수 있습니다.");
        }

        request.reject(reason);
        CondolenceRequest saved = condolenceRequestRepository.save(request);

        log.info("Condolence request rejected: id={}, reason={}", id, reason);

        return CondolenceRequestResponse.from(saved);
    }

    // Policy operations

    @Override
    @Transactional
    public CondolencePolicyResponse createPolicy(CreateCondolencePolicyRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (condolencePolicyRepository.existsByTenantIdAndEventType(tenantId, request.getEventType())) {
            throw new DuplicateException("EMP_012", "해당 경조사 유형의 정책이 이미 존재합니다.");
        }

        CondolencePolicy policy = CondolencePolicy.builder()
            .eventType(request.getEventType())
            .name(request.getName())
            .description(request.getDescription())
            .amount(request.getAmount())
            .leaveDays(request.getLeaveDays())
            .sortOrder(request.getSortOrder())
            .build();

        CondolencePolicy saved = condolencePolicyRepository.save(policy);

        log.info("Condolence policy created: id={}, eventType={}", saved.getId(), saved.getEventType());

        return CondolencePolicyResponse.from(saved);
    }

    @Override
    public CondolencePolicyResponse getPolicyById(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolencePolicy policy = findPolicyByIdAndTenantId(id, tenantId);
        return CondolencePolicyResponse.from(policy);
    }

    @Override
    public List<CondolencePolicyResponse> getAllPolicies() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CondolencePolicy> policies = condolencePolicyRepository.findAllByTenantId(tenantId);
        return policies.stream()
            .map(CondolencePolicyResponse::from)
            .toList();
    }

    @Override
    public List<CondolencePolicyResponse> getActivePolicies() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<CondolencePolicy> policies = condolencePolicyRepository.findActiveByTenantId(tenantId);
        return policies.stream()
            .map(CondolencePolicyResponse::from)
            .toList();
    }

    @Override
    @Transactional
    public CondolencePolicyResponse updatePolicy(UUID id, UpdateCondolencePolicyRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolencePolicy policy = findPolicyByIdAndTenantId(id, tenantId);

        policy.update(
            request.getName(),
            request.getDescription(),
            request.getAmount(),
            request.getLeaveDays(),
            request.getSortOrder()
        );

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                policy.activate();
            } else {
                policy.deactivate();
            }
        }

        CondolencePolicy saved = condolencePolicyRepository.save(policy);

        log.info("Condolence policy updated: id={}", id);

        return CondolencePolicyResponse.from(saved);
    }

    @Override
    @Transactional
    public void deletePolicy(UUID id) {
        UUID tenantId = TenantContext.getCurrentTenant();
        CondolencePolicy policy = findPolicyByIdAndTenantId(id, tenantId);
        condolencePolicyRepository.delete(policy);
        log.info("Condolence policy deleted: id={}", id);
    }

    private CondolenceRequest findRequestByIdAndTenantId(UUID id, UUID tenantId) {
        return condolenceRequestRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("EMP_010", "경조비 신청을 찾을 수 없습니다: " + id));
    }

    private CondolencePolicy findPolicyByIdAndTenantId(UUID id, UUID tenantId) {
        return condolencePolicyRepository.findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new NotFoundException("EMP_012", "경조비 정책을 찾을 수 없습니다: " + id));
    }
}
