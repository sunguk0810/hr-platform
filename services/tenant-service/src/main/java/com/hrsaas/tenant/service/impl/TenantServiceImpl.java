package com.hrsaas.tenant.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.tenant.domain.dto.request.CreateTenantRequest;
import com.hrsaas.tenant.domain.dto.request.UpdateTenantRequest;
import com.hrsaas.tenant.domain.dto.response.TenantResponse;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.event.TenantCreatedEvent;
import com.hrsaas.tenant.repository.TenantRepository;
import com.hrsaas.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public TenantResponse create(CreateTenantRequest request) {
        log.info("Creating tenant: code={}", request.getCode());

        // Validate uniqueness
        if (tenantRepository.existsByCode(request.getCode())) {
            throw new DuplicateException("TNT_004", "이미 사용 중인 테넌트 코드입니다: " + request.getCode());
        }

        if (request.getBusinessNumber() != null &&
            tenantRepository.existsByBusinessNumber(request.getBusinessNumber())) {
            throw new DuplicateException("TNT_004", "이미 등록된 사업자번호입니다: " + request.getBusinessNumber());
        }

        Tenant tenant = Tenant.builder()
            .code(request.getCode())
            .name(request.getName())
            .businessNumber(request.getBusinessNumber())
            .representativeName(request.getRepresentativeName())
            .address(request.getAddress())
            .phone(request.getPhone())
            .email(request.getEmail())
            .planType(request.getPlanType())
            .contractStartDate(request.getContractStartDate())
            .contractEndDate(request.getContractEndDate())
            .maxEmployees(request.getMaxEmployees())
            .build();

        Tenant saved = tenantRepository.save(tenant);

        // Publish event
        eventPublisher.publish(TenantCreatedEvent.of(saved));

        log.info("Tenant created: id={}, code={}", saved.getId(), saved.getCode());
        return TenantResponse.from(saved);
    }

    @Override
    @Cacheable(value = "tenant", key = "#id")
    public TenantResponse getById(UUID id) {
        Tenant tenant = findById(id);
        return TenantResponse.from(tenant);
    }

    @Override
    @Cacheable(value = "tenant", key = "'code:' + #code")
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
    @Transactional
    @CacheEvict(value = "tenant", allEntries = true)
    public TenantResponse update(UUID id, UpdateTenantRequest request) {
        Tenant tenant = findById(id);

        if (request.getName() != null) {
            tenant.setName(request.getName());
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
        if (request.getPlanType() != null) {
            tenant.setPlanType(request.getPlanType());
        }
        if (request.getContractEndDate() != null) {
            tenant.setContractEndDate(request.getContractEndDate());
        }
        if (request.getMaxEmployees() != null) {
            tenant.setMaxEmployees(request.getMaxEmployees());
        }

        Tenant updated = tenantRepository.save(tenant);
        log.info("Tenant updated: id={}", id);

        return TenantResponse.from(updated);
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant", allEntries = true)
    public TenantResponse activate(UUID id) {
        Tenant tenant = findById(id);
        tenant.activate();
        Tenant saved = tenantRepository.save(tenant);
        log.info("Tenant activated: id={}", id);
        return TenantResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant", allEntries = true)
    public TenantResponse suspend(UUID id) {
        Tenant tenant = findById(id);
        tenant.suspend();
        Tenant saved = tenantRepository.save(tenant);
        log.info("Tenant suspended: id={}", id);
        return TenantResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "tenant", allEntries = true)
    public void terminate(UUID id) {
        Tenant tenant = findById(id);
        tenant.terminate();
        tenantRepository.save(tenant);
        log.info("Tenant terminated: id={}", id);
    }

    private Tenant findById(UUID id) {
        return tenantRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("TNT_001", "테넌트를 찾을 수 없습니다: " + id));
    }
}
