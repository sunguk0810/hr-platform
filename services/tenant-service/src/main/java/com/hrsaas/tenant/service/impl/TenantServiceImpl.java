package com.hrsaas.tenant.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.constant.DefaultPolicyData;
import com.hrsaas.tenant.domain.constant.DefaultTenantSettings;
import com.hrsaas.tenant.domain.dto.policy.PasswordPolicyData;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.TenantSearchRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantBasicResponse;
import com.hrsaas.tenant.domain.dto.response.TenantDetailResponse;
import com.hrsaas.tenant.domain.dto.response.TenantListItemResponse;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.domain.dto.response.TenantTreeNodeResponse;
import com.hrsaas.tenant.domain.entity.PolicyType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantPolicy;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.domain.event.TenantCreatedEvent;
import com.hrsaas.tenant.domain.event.TenantStatusChangedEvent;
import com.hrsaas.tenant.domain.event.TenantUpdatedEvent;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.PlanUpgradeService;
import com.hrsaas.tenant.service.TenantDetailAssembler;
import com.hrsaas.tenant.service.TenantProvisioningService;
import com.hrsaas.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final TenantPolicyRepository tenantPolicyRepository;
    private final EventPublisher eventPublisher;
    private final TenantProvisioningService provisioningService;
    private final PlanUpgradeService planUpgradeService;
    private final TenantDetailAssembler detailAssembler;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public TenantResponse create(CreateTenantRequest request) {
        Tenant tenant = createTenantEntity(request);
        return TenantResponse.from(tenant);
    }

    @Override
    @Transactional
    public TenantDetailResponse createWithDetail(CreateTenantRequest request) {
        Tenant tenant = createTenantEntity(request);
        return detailAssembler.toDetailResponse(tenant);
    }

    private Tenant createTenantEntity(CreateTenantRequest request) {
        log.info("Creating tenant: code={}", request.getCode());

        if (tenantRepository.existsByCode(request.getCode())) {
            throw new DuplicateException("TNT_004", "이미 사용 중인 테넌트 코드입니다: " + request.getCode());
        }

        if (request.getBusinessNumber() != null &&
            tenantRepository.existsByBusinessNumber(request.getBusinessNumber())) {
            throw new DuplicateException("TNT_004", "이미 등록된 사업자번호입니다: " + request.getBusinessNumber());
        }

        // Determine level from parent
        Integer level = 0;
        if (request.getParentId() != null) {
            Tenant parent = tenantRepository.findById(request.getParentId())
                .orElseThrow(() -> new NotFoundException("TNT_001", "부모 테넌트를 찾을 수 없습니다: " + request.getParentId()));
            level = parent.getLevel() + 1;
        }

        Tenant tenant = Tenant.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .description(request.getDescription())
            .businessNumber(request.getBusinessNumber())
            .representativeName(request.getRepresentativeName())
            .address(request.getAddress())
            .phone(request.getPhone())
            .email(request.getEmail())
            .planType(request.getPlanType())
            .contractStartDate(request.getContractStartDate())
            .contractEndDate(request.getContractEndDate())
            .maxEmployees(request.getMaxEmployees())
            .parentId(request.getParentId())
            .level(level)
            .adminEmail(request.getAdminEmail())
            .adminName(request.getAdminName())
            .brandingData(DefaultTenantSettings.DEFAULT_BRANDING)
            .settingsData(DefaultTenantSettings.DEFAULT_SETTINGS)
            .hierarchyData(DefaultTenantSettings.DEFAULT_HIERARCHY)
            .allowedModules(DefaultTenantSettings.DEFAULT_MODULES)
            .build();

        Tenant saved = tenantRepository.save(tenant);

        provisioningService.provision(saved.getId(), saved.getPlanType());

        eventPublisher.publish(TenantCreatedEvent.of(saved));

        log.info("Tenant created: id={}, code={}", saved.getId(), saved.getCode());
        return saved;
    }

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "#id")
    public TenantResponse getById(UUID id) {
        Tenant tenant = findById(id);
        return TenantResponse.from(tenant);
    }

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "'basic:' + #id")
    public TenantBasicResponse getBasicInfo(UUID id) {
        Tenant tenant = findById(id);
        return TenantBasicResponse.from(tenant);
    }

    @Override
    public TenantDetailResponse getDetailById(UUID id) {
        Tenant tenant = findById(id);
        return detailAssembler.toDetailResponse(tenant);
    }

    @Override
    @Cacheable(value = CacheNames.TENANT, key = "'code:' + #code")
    public TenantResponse getByCode(String code) {
        Tenant tenant = tenantRepository.findByCode(code)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + code));
        return TenantResponse.from(tenant);
    }

    @Override
    public PageResponse<TenantResponse> getAll(Pageable pageable) {
        Page<Tenant> page = tenantRepository.findAll(pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(TenantResponse::from)
            .toList());
    }

    @Override
    public PageResponse<TenantListItemResponse> getAllList(Pageable pageable) {
        Page<Tenant> page = tenantRepository.findAll(pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(detailAssembler::toListItem)
            .collect(Collectors.toList()));
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantResponse update(UUID id, UpdateTenantRequest request) {
        Tenant tenant = applyUpdate(id, request);
        return TenantResponse.from(tenant);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantDetailResponse updateWithDetail(UUID id, UpdateTenantRequest request) {
        Tenant tenant = applyUpdate(id, request);
        return detailAssembler.toDetailResponse(tenant);
    }

    private Tenant applyUpdate(UUID id, UpdateTenantRequest request) {
        Tenant tenant = findById(id);

        if (request.getName() != null) {
            tenant.setName(request.getName());
        }
        if (request.getNameEn() != null) {
            tenant.setNameEn(request.getNameEn());
        }
        if (request.getDescription() != null) {
            tenant.setDescription(request.getDescription());
        }
        if (request.getLogoUrl() != null) {
            tenant.setLogoUrl(request.getLogoUrl());
        }
        if (request.getRepresentativeName() != null) {
            tenant.setRepresentativeName(request.getRepresentativeName());
        }
        if (request.getAddress() != null) {
            tenant.setAddress(request.getAddress());
        }
        if (request.getPhone() != null) {
            tenant.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            tenant.setEmail(request.getEmail());
        }
        if (request.getPlanType() != null && request.getPlanType() != tenant.getPlanType()) {
            tenant.setPlanType(request.getPlanType());
            planUpgradeService.syncFeatures(id, request.getPlanType());
        }
        if (request.getContractEndDate() != null) {
            tenant.setContractEndDate(request.getContractEndDate());
        }
        if (request.getMaxEmployees() != null) {
            tenant.setMaxEmployees(request.getMaxEmployees());
        }

        // JSON data fields
        if (request.getBranding() != null) {
            try {
                tenant.setBrandingData(objectMapper.writeValueAsString(request.getBranding()));
            } catch (Exception e) {
                log.warn("Failed to serialize branding data", e);
            }
        }
        if (request.getSettings() != null) {
            try {
                tenant.setSettingsData(objectMapper.writeValueAsString(request.getSettings()));
            } catch (Exception e) {
                log.warn("Failed to serialize settings data", e);
            }
        }

        Tenant updated = tenantRepository.save(tenant);

        eventPublisher.publish(TenantUpdatedEvent.of(updated));

        log.info("Tenant updated: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantResponse activate(UUID id) {
        Tenant tenant = findById(id);
        TenantStatus previous = tenant.getStatus();
        tenant.activate();
        Tenant saved = tenantRepository.save(tenant);

        eventPublisher.publish(TenantStatusChangedEvent.builder()
            .tenantId(saved.getId())
            .tenantCode(saved.getCode())
            .previousStatus(previous)
            .newStatus(TenantStatus.ACTIVE)
            .build());

        log.info("Tenant activated: id={}", id);
        return TenantResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantResponse suspend(UUID id) {
        Tenant tenant = findById(id);
        TenantStatus previous = tenant.getStatus();
        tenant.suspend();
        Tenant saved = tenantRepository.save(tenant);

        eventPublisher.publish(TenantStatusChangedEvent.builder()
            .tenantId(saved.getId())
            .tenantCode(saved.getCode())
            .previousStatus(previous)
            .newStatus(TenantStatus.SUSPENDED)
            .build());

        log.info("Tenant suspended: id={}", id);
        return TenantResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public void terminate(UUID id) {
        Tenant tenant = findById(id);
        TenantStatus previous = tenant.getStatus();
        tenant.terminate();
        tenantRepository.save(tenant);

        eventPublisher.publish(TenantStatusChangedEvent.builder()
            .tenantId(tenant.getId())
            .tenantCode(tenant.getCode())
            .previousStatus(previous)
            .newStatus(TenantStatus.TERMINATED)
            .build());

        log.info("Tenant terminated: id={}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.TENANT, allEntries = true)
    public TenantDetailResponse changeStatus(UUID id, TenantStatus newStatus) {
        Tenant tenant = findById(id);
        TenantStatus previous = tenant.getStatus();
        tenant.changeStatus(newStatus);
        Tenant saved = tenantRepository.save(tenant);

        eventPublisher.publish(TenantStatusChangedEvent.builder()
            .tenantId(saved.getId())
            .tenantCode(saved.getCode())
            .previousStatus(previous)
            .newStatus(newStatus)
            .build());

        log.info("Tenant status changed: id={}, {} -> {}", id, previous, newStatus);
        return detailAssembler.toDetailResponse(saved);
    }

    @Override
    public PageResponse<TenantResponse> search(TenantSearchRequest request, Pageable pageable) {
        Page<Tenant> page = tenantRepository.search(request, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(TenantResponse::from)
            .toList());
    }

    @Override
    public PageResponse<TenantListItemResponse> searchList(TenantSearchRequest request, Pageable pageable) {
        Page<Tenant> page = tenantRepository.search(request, pageable);
        return PageResponse.from(page, page.getContent().stream()
            .map(detailAssembler::toListItem)
            .collect(Collectors.toList()));
    }

    @Override
    public List<TenantTreeNodeResponse> getTenantTree() {
        List<Tenant> allTenants = tenantRepository.findByStatusNot(TenantStatus.TERMINATED);

        // Build parent-children map
        Map<UUID, List<Tenant>> childrenMap = new HashMap<>();
        List<Tenant> roots = new ArrayList<>();

        for (Tenant tenant : allTenants) {
            if (tenant.getParentId() == null) {
                roots.add(tenant);
            } else {
                childrenMap.computeIfAbsent(tenant.getParentId(), k -> new ArrayList<>()).add(tenant);
            }
        }

        return roots.stream()
            .map(root -> buildTreeNode(root, childrenMap))
            .collect(Collectors.toList());
    }

    private TenantTreeNodeResponse buildTreeNode(Tenant tenant, Map<UUID, List<Tenant>> childrenMap) {
        List<TenantTreeNodeResponse> children = childrenMap.getOrDefault(tenant.getId(), List.of())
            .stream()
            .map(child -> buildTreeNode(child, childrenMap))
            .collect(Collectors.toList());

        return TenantTreeNodeResponse.builder()
            .id(tenant.getId())
            .code(tenant.getCode())
            .name(tenant.getName())
            .status(tenant.getStatus())
            .employeeCount(0)
            .level(tenant.getLevel())
            .children(children)
            .build();
    }

    @Override
    public List<TenantListItemResponse> getSubsidiaries(UUID parentId) {
        if (!tenantRepository.existsById(parentId)) {
            throw new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + parentId);
        }

        List<Tenant> subsidiaries = tenantRepository.findByParentId(parentId);
        return subsidiaries.stream()
            .map(detailAssembler::toListItem)
            .collect(Collectors.toList());
    }

    @Override
    public TenantStatus getStatus(UUID id) {
        Tenant tenant = findById(id);
        return tenant.getStatus();
    }

    @Override
    public PasswordPolicyData getPasswordPolicy(UUID tenantId) {
        TenantPolicy policy = tenantPolicyRepository.findByTenantIdAndPolicyType(tenantId, PolicyType.PASSWORD)
            .orElse(null);

        String json = (policy != null) ? policy.getPolicyData() : DefaultPolicyData.get(PolicyType.PASSWORD);
        try {
            return objectMapper.readValue(json, PasswordPolicyData.class);
        } catch (Exception e) {
            log.warn("Failed to parse password policy for tenant {}, using default", tenantId, e);
            try {
                return objectMapper.readValue(DefaultPolicyData.get(PolicyType.PASSWORD), PasswordPolicyData.class);
            } catch (Exception ex) {
                throw new BusinessException("TNT_005", "비밀번호 정책 파싱 실패");
            }
        }
    }

    private Tenant findById(UUID id) {
        return tenantRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + id));
    }
}
