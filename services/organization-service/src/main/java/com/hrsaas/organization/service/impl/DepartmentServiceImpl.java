package com.hrsaas.organization.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.client.EmployeeClient;
import com.hrsaas.organization.client.dto.BulkTransferRequest;
import com.hrsaas.organization.client.dto.EmployeeClientResponse;
import com.hrsaas.organization.domain.event.DepartmentCreatedEvent;
import com.hrsaas.organization.domain.event.DepartmentMergedEvent;
import com.hrsaas.organization.domain.event.DepartmentSplitEvent;
import com.hrsaas.organization.domain.event.DepartmentUpdatedEvent;
import com.hrsaas.organization.service.OrganizationHistoryService;
import com.hrsaas.organization.domain.dto.request.CreateDepartmentRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentMergeRequest;
import com.hrsaas.organization.domain.dto.request.OrgHistorySearchRequest;
import com.hrsaas.organization.domain.dto.request.DepartmentSplitRequest;
import com.hrsaas.organization.domain.dto.request.UpdateDepartmentRequest;
import com.hrsaas.organization.domain.dto.response.*;
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
    private final OrganizationHistoryService organizationHistoryService;

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

        // 전체 부서를 1회 쿼리로 로드 후 in-memory 트리 구성 (N+1 재귀 로드 방지)
        List<Department> allDepartments = departmentRepository.findAllWithParent(
            tenantId, DepartmentStatus.ACTIVE);

        // parentId 기준 Map 구성
        Map<UUID, List<Department>> childrenMap = allDepartments.stream()
            .filter(d -> d.getParent() != null)
            .collect(Collectors.groupingBy(d -> d.getParent().getId()));

        // 루트 부서 필터링 후 트리 빌드
        return allDepartments.stream()
            .filter(d -> d.getParent() == null)
            .map(root -> buildTreeNode(root, childrenMap))
            .collect(Collectors.toList());
    }

    private DepartmentTreeResponse buildTreeNode(Department department,
                                                   Map<UUID, List<Department>> childrenMap) {
        List<DepartmentTreeResponse> children = null;
        List<Department> childDepts = childrenMap.get(department.getId());
        if (childDepts != null && !childDepts.isEmpty()) {
            children = childDepts.stream()
                .map(child -> buildTreeNode(child, childrenMap))
                .collect(Collectors.toList());
        }
        return DepartmentTreeResponse.fromWithChildren(department, children);
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

        organizationHistoryService.recordEvent("DEPARTMENT_DELETED", id,
            department.getName(), department.getName() + " 부서 삭제",
            department.getName() + " 부서가 삭제되었습니다.", null, null, null);

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
        return organizationHistoryService.getOrganizationHistory(pageable);
    }

    @Override
    public Page<DepartmentHistoryResponse> getOrganizationHistory(OrgHistorySearchRequest request, Pageable pageable) {
        return organizationHistoryService.getOrganizationHistory(request, pageable);
    }

    @Override
    public List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId) {
        findById(departmentId); // verify existence
        return organizationHistoryService.getDepartmentHistory(departmentId);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheNames.DEPARTMENT, CacheNames.ORGANIZATION_TREE}, allEntries = true)
    public DepartmentMergeResponse merge(DepartmentMergeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        // 1. Validate source departments
        List<Department> sources = new ArrayList<>();
        for (UUID sourceId : request.getSourceDepartmentIds()) {
            Department source = findById(sourceId);
            if (!source.isActive() && source.getStatus() != DepartmentStatus.INACTIVE) {
                throw new BusinessException("ORG_014", "활성/비활성 상태의 부서만 통합할 수 있습니다: " + sourceId);
            }
            sources.add(source);
        }

        // 2. Get or create target department
        Department target;
        if (request.getTargetDepartmentId() != null) {
            target = findById(request.getTargetDepartmentId());
        } else {
            if (departmentRepository.existsByCodeAndTenantId(request.getTargetDepartmentCode(), tenantId)) {
                throw new DuplicateException("ORG_001", "이미 존재하는 부서 코드입니다: " + request.getTargetDepartmentCode());
            }
            Department firstSource = sources.get(0);
            target = Department.builder()
                .code(request.getTargetDepartmentCode())
                .name(request.getTargetDepartmentName())
                .parent(firstSource.getParent())
                .build();
            target = departmentRepository.save(target);
        }

        // 3. Transfer employees from all sources to target
        int totalTransferred = 0;
        for (Department source : sources) {
            if (!source.getId().equals(target.getId())) {
                try {
                    Long empCount = employeeClient.countByDepartmentId(source.getId()).getData();
                    if (empCount != null && empCount > 0) {
                        employeeClient.bulkTransferDepartment(BulkTransferRequest.builder()
                            .employeeIds(List.of()) // empty = all employees in department
                            .targetDepartmentId(target.getId())
                            .build());
                        totalTransferred += empCount.intValue();
                    }
                } catch (Exception e) {
                    log.warn("Failed to transfer employees from department {}: {}", source.getId(), e.getMessage());
                }
            }
        }

        // 4. Set source departments to MERGED
        List<UUID> mergedIds = new ArrayList<>();
        for (Department source : sources) {
            if (!source.getId().equals(target.getId())) {
                source.setStatus(DepartmentStatus.MERGED);
                departmentRepository.save(source);
                mergedIds.add(source.getId());
            }
        }

        // 5. Publish event
        eventPublisher.publish(DepartmentMergedEvent.builder()
            .sourceIds(mergedIds)
            .targetId(target.getId())
            .targetName(target.getName())
            .reason(request.getReason())
            .build());

        log.info("Departments merged: sources={}, target={}", mergedIds, target.getId());

        return DepartmentMergeResponse.builder()
            .targetDepartment(DepartmentResponse.from(target))
            .mergedDepartmentIds(mergedIds)
            .transferredEmployeeCount(totalTransferred)
            .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheNames.DEPARTMENT, CacheNames.ORGANIZATION_TREE}, allEntries = true)
    public DepartmentSplitResponse split(DepartmentSplitRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Department source = findById(request.getSourceDepartmentId());

        List<DepartmentResponse> newDepartments = new ArrayList<>();
        List<UUID> newDepartmentIds = new ArrayList<>();

        // Create new departments
        if (request.getNewDepartments() != null) {
            for (DepartmentSplitRequest.SplitTarget splitTarget : request.getNewDepartments()) {
                if (departmentRepository.existsByCodeAndTenantId(splitTarget.getCode(), tenantId)) {
                    throw new DuplicateException("ORG_001", "이미 존재하는 부서 코드입니다: " + splitTarget.getCode());
                }

                Department newDept = Department.builder()
                    .code(splitTarget.getCode())
                    .name(splitTarget.getName())
                    .parent(source.getParent())
                    .build();
                newDept = departmentRepository.save(newDept);
                newDepartmentIds.add(newDept.getId());

                // Transfer specified employees
                if (splitTarget.getEmployeeIds() != null && !splitTarget.getEmployeeIds().isEmpty()) {
                    try {
                        employeeClient.bulkTransferDepartment(BulkTransferRequest.builder()
                            .employeeIds(splitTarget.getEmployeeIds())
                            .targetDepartmentId(newDept.getId())
                            .build());
                    } catch (Exception e) {
                        log.warn("Failed to transfer employees to new department {}: {}", newDept.getId(), e.getMessage());
                    }
                }

                newDepartments.add(DepartmentResponse.from(newDept));
            }
        }

        // Deactivate source if not keeping
        if (!request.isKeepSource()) {
            source.deactivate();
            departmentRepository.save(source);
        }

        // Publish event
        eventPublisher.publish(DepartmentSplitEvent.builder()
            .sourceId(source.getId())
            .newDepartmentIds(newDepartmentIds)
            .reason(request.getReason())
            .build());

        log.info("Department split: source={}, newDepts={}", source.getId(), newDepartmentIds);

        return DepartmentSplitResponse.builder()
            .sourceDepartmentId(source.getId())
            .newDepartments(newDepartments)
            .sourceKept(request.isKeepSource())
            .build();
    }

    @Override
    public List<OrgChartNodeResponse> getOrgChart() {
        UUID tenantId = TenantContext.getCurrentTenant();

        // 전체 부서를 1회 쿼리로 로드 (N+1 재귀 로드 방지)
        List<Department> allDepartments = departmentRepository.findAllWithParent(
            tenantId, DepartmentStatus.ACTIVE);

        // 부서별 직원 수를 배치 API로 1회 조회 (N+1 Feign 호출 방지)
        List<UUID> departmentIds = allDepartments.stream()
            .map(Department::getId)
            .toList();

        Map<UUID, Long> empCountMap;
        try {
            empCountMap = employeeClient.countByDepartmentIds(departmentIds).getData();
            if (empCountMap == null) empCountMap = Map.of();
        } catch (Exception e) {
            log.warn("Failed to batch get employee counts: {}", e.getMessage());
            empCountMap = Map.of();
        }

        // Batch fetch manager details
        List<UUID> managerIds = allDepartments.stream()
            .map(Department::getManagerId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .toList();

        Map<UUID, EmployeeClientResponse> managerInfoMap;
        if (!managerIds.isEmpty()) {
            try {
                List<EmployeeClientResponse> managers = employeeClient.getBatch(managerIds).getData();
                managerInfoMap = managers != null ? managers.stream()
                    .collect(Collectors.toMap(EmployeeClientResponse::getId, m -> m))
                    : Map.of();
            } catch (Exception e) {
                log.warn("Failed to batch get manager info: {}", e.getMessage());
                managerInfoMap = Map.of();
            }
        } else {
            managerInfoMap = Map.of();
        }

        // parentId 기준 Map 구성
        Map<UUID, List<Department>> childrenMap = allDepartments.stream()
            .filter(d -> d.getParent() != null)
            .collect(Collectors.groupingBy(d -> d.getParent().getId()));

        // 루트 부서 필터링 후 트리 빌드
        Map<UUID, Long> finalEmpCountMap = empCountMap;
        Map<UUID, EmployeeClientResponse> finalManagerInfoMap = managerInfoMap;
        return allDepartments.stream()
            .filter(d -> d.getParent() == null)
            .map(root -> buildOrgChartNode(root, childrenMap, finalEmpCountMap, finalManagerInfoMap))
            .collect(Collectors.toList());
    }

    private OrgChartNodeResponse buildOrgChartNode(Department department,
                                                     Map<UUID, List<Department>> childrenMap,
                                                     Map<UUID, Long> empCountMap,
                                                     Map<UUID, EmployeeClientResponse> managerInfoMap) {
        Long empCount = empCountMap.getOrDefault(department.getId(), 0L);
        if (empCount < 0) empCount = 0L;

        OrgChartNodeResponse.ManagerInfo managerInfo = null;
        if (department.getManagerId() != null) {
            EmployeeClientResponse emp = managerInfoMap.get(department.getManagerId());
            if (emp != null) {
                managerInfo = OrgChartNodeResponse.ManagerInfo.builder()
                    .id(department.getManagerId())
                    .name(emp.getName())
                    .gradeName(emp.getGradeName())
                    .positionName(emp.getPositionName())
                    .build();
            } else {
                managerInfo = OrgChartNodeResponse.ManagerInfo.builder()
                    .id(department.getManagerId())
                    .build();
            }
        }

        List<OrgChartNodeResponse> children = null;
        List<Department> childDepts = childrenMap.get(department.getId());
        if (childDepts != null && !childDepts.isEmpty()) {
            children = childDepts.stream()
                .filter(Department::isActive)
                .map(child -> buildOrgChartNode(child, childrenMap, empCountMap, managerInfoMap))
                .collect(Collectors.toList());
        }

        return OrgChartNodeResponse.builder()
            .id(department.getId())
            .code(department.getCode())
            .name(department.getName())
            .level(department.getLevel())
            .status(department.getStatus().name())
            .manager(managerInfo)
            .employeeCount(empCount.intValue())
            .children(children)
            .build();
    }
}
