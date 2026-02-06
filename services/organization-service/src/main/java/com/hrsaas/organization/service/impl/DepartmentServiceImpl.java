package com.hrsaas.organization.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
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

    private final DepartmentRepository departmentRepository;
    private final EventPublisher eventPublisher;

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
        }

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
        if (request.getParentId() != null) {
            Department parent = findById(request.getParentId());
            department.setParent(parent);
            department.updateHierarchy();
        }
        if (request.getManagerId() != null) {
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
        department.setStatus(DepartmentStatus.DELETED);
        departmentRepository.save(department);
        log.info("Department deleted: id={}", id);
    }

    private Department findById(UUID id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("ORG_001", "부서를 찾을 수 없습니다: " + id));
    }

    @Override
    public Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // TODO: In production, this would query an audit/history table
        // For now, return mock data based on departments
        List<Department> departments = departmentRepository.findAllByTenantAndStatus(
            tenantId, DepartmentStatus.ACTIVE);

        List<DepartmentHistoryResponse> histories = new ArrayList<>();

        for (Department dept : departments) {
            // Create mock history entry for department creation
            histories.add(DepartmentHistoryResponse.builder()
                .id(UUID.randomUUID())
                .type(DepartmentHistoryResponse.EventType.DEPARTMENT_CREATED.name().toLowerCase())
                .date(dept.getCreatedAt())
                .title(dept.getName() + " 부서 생성")
                .description(dept.getName() + " 부서가 생성되었습니다.")
                .actor(DepartmentHistoryResponse.ActorInfo.builder()
                    .id(dept.getCreatedBy() != null ? UUID.fromString(dept.getCreatedBy()) : null)
                    .name("시스템")
                    .build())
                .departmentId(dept.getId())
                .departmentName(dept.getName())
                .metadata(Map.of("code", dept.getCode()))
                .build());
        }

        // Sort by date descending
        histories.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), histories.size());

        List<DepartmentHistoryResponse> pageContent = histories.subList(
            Math.min(start, histories.size()),
            Math.min(end, histories.size())
        );

        return new PageImpl<>(pageContent, pageable, histories.size());
    }

    @Override
    public List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId) {
        Department department = findById(departmentId);

        List<DepartmentHistoryResponse> histories = new ArrayList<>();

        // TODO: In production, this would query an audit/history table
        // For now, return mock data for the specific department

        // Department creation event
        histories.add(DepartmentHistoryResponse.builder()
            .id(UUID.randomUUID())
            .type(DepartmentHistoryResponse.EventType.DEPARTMENT_CREATED.name().toLowerCase())
            .date(department.getCreatedAt())
            .title(department.getName() + " 부서 생성")
            .description(department.getName() + " 부서가 생성되었습니다.")
            .actor(DepartmentHistoryResponse.ActorInfo.builder()
                .id(department.getCreatedBy() != null ? UUID.fromString(department.getCreatedBy()) : null)
                .name("시스템")
                .build())
            .departmentId(department.getId())
            .departmentName(department.getName())
            .metadata(Map.of("code", department.getCode()))
            .build());

        // If updated, add update event
        if (department.getUpdatedAt() != null &&
            !department.getUpdatedAt().equals(department.getCreatedAt())) {
            histories.add(DepartmentHistoryResponse.builder()
                .id(UUID.randomUUID())
                .type(DepartmentHistoryResponse.EventType.DEPARTMENT_RENAMED.name().toLowerCase())
                .date(department.getUpdatedAt())
                .title(department.getName() + " 부서 수정")
                .description(department.getName() + " 부서 정보가 수정되었습니다.")
                .actor(DepartmentHistoryResponse.ActorInfo.builder()
                    .id(department.getUpdatedBy() != null ? UUID.fromString(department.getUpdatedBy()) : null)
                    .name("관리자")
                    .build())
                .departmentId(department.getId())
                .departmentName(department.getName())
                .build());
        }

        // Sort by date descending
        histories.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        return histories;
    }
}
