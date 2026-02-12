package com.hrsaas.organization.service.impl;

import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.response.DepartmentHistoryResponse;
import com.hrsaas.organization.domain.entity.OrganizationHistory;
import com.hrsaas.organization.domain.event.DepartmentCreatedEvent;
import com.hrsaas.organization.domain.event.DepartmentMergedEvent;
import com.hrsaas.organization.domain.event.DepartmentSplitEvent;
import com.hrsaas.organization.domain.event.DepartmentUpdatedEvent;
import com.hrsaas.organization.repository.OrganizationHistoryRepository;
import com.hrsaas.organization.service.OrganizationHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationHistoryServiceImpl implements OrganizationHistoryService {

    private final OrganizationHistoryRepository organizationHistoryRepository;

    @Override
    @Transactional
    public void recordEvent(String eventType, UUID departmentId, String departmentName,
                            String title, String description, String prevValue, String newValue,
                            String metadata) {
        UUID tenantId = TenantContext.getCurrentTenant();
        var currentUser = SecurityContextHolder.getCurrentUser();

        OrganizationHistory history = OrganizationHistory.builder()
            .tenantId(tenantId)
            .eventType(eventType)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .title(title)
            .description(description)
            .previousValue(prevValue)
            .newValue(newValue)
            .actorId(currentUser != null ? currentUser.getUserId() : null)
            .actorName(currentUser != null ? currentUser.getUsername() : "시스템")
            .eventDate(Instant.now())
            .metadata(metadata)
            .build();

        organizationHistoryRepository.save(history);
        log.debug("Organization history recorded: type={}, dept={}", eventType, departmentName);
    }

    @Override
    public Page<DepartmentHistoryResponse> getOrganizationHistory(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<OrganizationHistory> page = organizationHistoryRepository
            .findByTenantIdOrderByEventDateDesc(tenantId, pageable);
        return page.map(this::toResponse);
    }

    @Override
    public List<DepartmentHistoryResponse> getDepartmentHistory(UUID departmentId) {
        List<OrganizationHistory> histories = organizationHistoryRepository
            .findByDepartmentIdOrderByEventDateDesc(departmentId);
        return histories.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDepartmentCreated(DepartmentCreatedEvent event) {
        recordEventFromEvent(
            "DEPARTMENT_CREATED",
            event.getDepartmentId(),
            event.getName(),
            event.getName() + " 부서 생성",
            event.getName() + " 부서가 생성되었습니다.",
            null,
            "{\"code\":\"" + event.getCode() + "\",\"level\":" + event.getLevel() + "}",
            null
        );
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDepartmentUpdated(DepartmentUpdatedEvent event) {
        recordEventFromEvent(
            "DEPARTMENT_UPDATED",
            event.getDepartmentId(),
            event.getName(),
            event.getName() + " 부서 수정",
            event.getName() + " 부서 정보가 수정되었습니다.",
            null,
            "{\"status\":\"" + event.getStatus() + "\"}",
            null
        );
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDepartmentMerged(DepartmentMergedEvent event) {
        recordEventFromEvent(
            "DEPARTMENT_MERGED",
            event.getTargetId(),
            event.getTargetName(),
            "부서 통합: " + event.getTargetName(),
            event.getSourceIds().size() + "개 부서가 " + event.getTargetName() + "으로 통합되었습니다.",
            "{\"sourceIds\":" + event.getSourceIds() + "}",
            "{\"targetId\":\"" + event.getTargetId() + "\"}",
            event.getReason()
        );
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDepartmentSplit(DepartmentSplitEvent event) {
        recordEventFromEvent(
            "DEPARTMENT_SPLIT",
            event.getSourceId(),
            null,
            "부서 분리",
            event.getNewDepartmentIds().size() + "개 신규 부서로 분리되었습니다.",
            "{\"sourceId\":\"" + event.getSourceId() + "\"}",
            "{\"newDepartmentIds\":" + event.getNewDepartmentIds() + "}",
            event.getReason()
        );
    }

    private void recordEventFromEvent(String eventType, UUID departmentId, String departmentName,
                                       String title, String description, String prevValue,
                                       String newValue, String metadata) {
        UUID tenantId = TenantContext.getCurrentTenant();

        OrganizationHistory history = OrganizationHistory.builder()
            .tenantId(tenantId != null ? tenantId : UUID.randomUUID())
            .eventType(eventType)
            .departmentId(departmentId)
            .departmentName(departmentName)
            .title(title)
            .description(description)
            .previousValue(prevValue)
            .newValue(newValue)
            .eventDate(Instant.now())
            .metadata(metadata)
            .build();

        organizationHistoryRepository.save(history);
    }

    private DepartmentHistoryResponse toResponse(OrganizationHistory history) {
        return DepartmentHistoryResponse.builder()
            .id(history.getId())
            .type(history.getEventType().toLowerCase())
            .date(history.getEventDate())
            .title(history.getTitle())
            .description(history.getDescription())
            .actor(DepartmentHistoryResponse.ActorInfo.builder()
                .id(history.getActorId())
                .name(history.getActorName())
                .build())
            .departmentId(history.getDepartmentId())
            .departmentName(history.getDepartmentName())
            .previousValue(history.getPreviousValue())
            .newValue(history.getNewValue())
            .build();
    }
}
