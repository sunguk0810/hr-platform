package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    @CacheEvict(value = {"department", "organization:tree"}, allEntries = true)
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
        log.info("Department created: id={}, code={}", saved.getId(), saved.getCode());

        return DepartmentResponse.from(saved);
    }

    @Override
    @Cacheable(value = "department", key = "#id")
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
    @Cacheable(value = "organization:tree")
    public List<DepartmentTreeResponse> getTree() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Department> rootDepartments = departmentRepository.findRootDepartments(
            tenantId, DepartmentStatus.ACTIVE);

        return rootDepartments.stream()
            .map(DepartmentTreeResponse::fromWithChildren)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = {"department", "organization:tree"}, allEntries = true)
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
        log.info("Department updated: id={}", id);

        return DepartmentResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"department", "organization:tree"}, allEntries = true)
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
}
