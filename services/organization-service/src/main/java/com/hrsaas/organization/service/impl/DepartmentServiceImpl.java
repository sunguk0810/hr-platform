package com.hrsaas.organization.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.domain.event.DepartmentCreatedEvent;
import com.hrsaas.organization.domain.event.DepartmentUpdatedEvent;
import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.DepartmentHistoryResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentResponse;
import com.hrsaas.organization.domain.dto.response.DepartmentTreeResponse;
import com.hrsaas.organization.domain.entity.Department;
import com.hrsaas.organization.domain.entity.DepartmentStatus;
import com.hrsaas.organization.repository.DepartmentRepository;
import com.hrsaas.organization.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentServiceImpl implements DepartmentService {

    private static final int MAX_DEPTH = 10;

    private final DepartmentRepository departmentRepository;
    private final EventPublisher eventPublisher;
    private final EmployeeClient employeeClient;

    @Override
    @Transactional
    @CacheEvict(value = {CacheNames.DEPARTMENT, CacheNames.ORGANIZATION_TREE}, allEntries = true)
    public DepartmentResponse create(CreateDepartmentRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (departmentRepository.existsByCodeAndTenantId(request.getCode(), tenantId)) {
            throw new DuplicateException("ORG_001", "이미 존재하는 부서 코드입니다: " + request.getCode());
        }

        Department parent = null;
        if (request.getParentId() != null) {
            parent = findById(request.getParentId());
            // G04: depth limit
            if (parent.getLevel() >= MAX_DEPTH) {
                throw new BusinessException("ORG_011", "부서 계층 깊이가 최대 " + MAX_DEPTH + "을 초과할 수 없습니다.");
            }
        }

        // G10: manager verification
        validateManagerId(request.getManagerId());

        Department department = Department.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .parent(parent)
            .managerId(request.getManagerId())
            .sortOrder(request.getSortOrder())
            .build();

        Department saved = departmentRepository.save(department);

        // Publish event
        eventPublisher.publish(DepartmentCreatedEvent.of(saved));

        log.info("Department created: id={}, code={}", saved.getId(), saved.getCode());

        return DepartmentResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.DEPARTMENT, key = "#id")
    public DepartmentResponse getById(UUID id) {
        Department department = findById(id);
        return DepartmentResponse.from(department);
    }

    @Override
    public List<DepartmentResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Department> departments = departmentRepository.findAllByTenantAndStatus(
            tenantId, DepartmentStatus.ACTIVE);

        return departments.stream()
            .map(DepartmentResponse::from)
            .toList();
    }

    @Override
    @Cacheable(value = CacheNames.ORGANIZATION_TREE, unless = "#result == null || #result.isEmpty()")
    public List<DepartmentTreeResponse> getTree() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Department> rootDepartments = departmentRepository.findRootDepartments(
            tenantId, DepartmentStatus.ACTIVE);

        return rootDepartments.stream()
            .map(DepartmentTreeResponse::fromWithChildren)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheNames.DEPARTMENT, CacheNames.ORGANIZATION_TREE}, allEntries = true)
    public DepartmentResponse update(UUID id, UpdateDepartmentRequest request) {
        Department department = findById(id);

        if (request.getName() != null) {
            department.setName(request.getName());
        }
        if (request.getNameEn() != null) {
            department.setNameEn(request.getNameEn());
        }
        // G09: code is immutable — UpdateDepartmentRequest has no code field
        if (request.getParentId() != null) {
            Department parent = findById(request.getParentId());
            // G04: check depth limit on move
            int newLevel = parent.getLevel() + 1;
            int maxChildDepth = getMaxChildDepth(department);
            if (newLevel + maxChildDepth > MAX_DEPTH) {
                throw new BusinessException("ORG_011",
                    "이동 후 부서 계층 깊이가 최대 " + MAX_DEPTH + "을 초과합니다.");
            }
            department.setParent(parent);
            department.updateHierarchy();
            recalculateSubTreeLevels(department);
        }
        if (request.getManagerId() != null) {
            // G10: manager verification
            validateManagerId(request.getManagerId());
            department.setManagerId(request.getManagerId());
        }
        if (request.getSortOrder() != null) {
            department.setSortOrder(request.getSortOrder());
        }

        Department saved = departmentRepository.save(department);

        // Publish event
        eventPublisher.publish(DepartmentUpdatedEvent.of(saved));

        log.info("Department updated: id={}", id);

        return DepartmentResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheNames.DEPARTMENT, CacheNames.ORGANIZATION_TREE}, allEntries = true)
    public void delete(UUID id) {
        Department department = findById(id);

        // G01: check for employees before delete
        Long empCount = employeeClient.countByDepartmentId(id).getData();
        if (empCount != 0) { // -1 (fallback) also blocks deletion
            throw new BusinessException("ORG_010", "소속 직원이 있어 삭제할 수 없습니다.");
        }

        department.setStatus(DepartmentStatus.DELETED);
        departmentRepository.save(department);
        log.info("Department deleted: id={}", id);
    }

    private Department findById(UUID id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("ORG_001", "부서를 찾을 수 없습니다: " + id));
    }

    /**
     * G10: Validate manager exists via employee-service.
     */
    private void validateManagerId(UUID managerId) {
        if (managerId != null) {
            Boolean exists = employeeClient.existsById(managerId).getData();
            if (!Boolean.TRUE.equals(exists)) {
                throw new BusinessException("ORG_012", "유효하지 않은 관리자 ID입니다.");
            }
        }
    }

    /**
     * G04: Calculate the maximum depth of a department's subtree.
     */
    private int getMaxChildDepth(Department department) {
        if (department.getChildren() == null || department.getChildren().isEmpty()) {
            return 0;
        }
        int max = 0;
        for (Department child : department.getChildren()) {
            max = Math.max(max, 1 + getMaxChildDepth(child));
        }
        return max;
    }

    /**
     * G04: Recalculate levels for all children after a parent move.
     */
    private void recalculateSubTreeLevels(Department department) {
        if (department.getChildren() == null) return;
        for (Department child : department.getChildren()) {
            child.updateHierarchy();
            recalculateSubTreeLevels(child);
        }
    }

    @Override
    public Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable) {
        // Delegate to OrganizationHistoryService (will be connected in Phase 4)
        // Temporary: return empty page until Phase 4
        return new PageImpl<>(List.of(), pageable, 0);
    }

    @Override
    public List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId) {
        findById(departmentId); // verify existence
        // Delegate to OrganizationHistoryService (will be connected in Phase 4)
        // Temporary: return empty list until Phase 4
        return List.of();
    }
}
