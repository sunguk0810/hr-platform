package com.hrsaas.organization.service.impl;

import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.request.CreatePositionRequest;
import com.hrsaas.organization.domain.dto.request.UpdatePositionRequest;
import com.hrsaas.organization.domain.dto.response.PositionResponse;
import com.hrsaas.organization.domain.entity.Position;
import com.hrsaas.organization.repository.PositionRepository;
import com.hrsaas.organization.service.PositionService;
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
public class PositionServiceImpl implements PositionService {

    private final PositionRepository positionRepository;

    @Override
    @Transactional
    @CacheEvict(value = "position", allEntries = true)
    public PositionResponse create(CreatePositionRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (positionRepository.existsByCodeAndTenantId(request.getCode(), tenantId)) {
            throw new DuplicateException("ORG_003", "이미 존재하는 직책 코드입니다: " + request.getCode());
        }

        Position position = Position.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .level(request.getLevel())
            .sortOrder(request.getSortOrder())
            .build();

        Position saved = positionRepository.save(position);
        log.info("Position created: id={}, code={}", saved.getId(), saved.getCode());

        return PositionResponse.from(saved);
    }

    @Override
    @Cacheable(value = "position", key = "#id")
    public PositionResponse getById(UUID id) {
        Position position = findById(id);
        return PositionResponse.from(position);
    }

    @Override
    public PositionResponse getByCode(String code) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Position position = positionRepository.findByCodeAndTenantId(code, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_003", "직책을 찾을 수 없습니다: " + code));
        return PositionResponse.from(position);
    }

    @Override
    public List<PositionResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Position> positions = positionRepository.findAllByTenantId(tenantId);

        return positions.stream()
            .map(PositionResponse::from)
            .toList();
    }

    @Override
    public List<PositionResponse> getActive() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Position> positions = positionRepository.findActiveByTenantId(tenantId);

        return positions.stream()
            .map(PositionResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "position", allEntries = true)
    public PositionResponse update(UUID id, UpdatePositionRequest request) {
        Position position = findById(id);

        position.update(request.getName(), request.getNameEn(), request.getLevel(), request.getSortOrder());

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                position.activate();
            } else {
                position.deactivate();
            }
        }

        Position saved = positionRepository.save(position);
        log.info("Position updated: id={}", id);

        return PositionResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = "position", allEntries = true)
    public void delete(UUID id) {
        Position position = findById(id);
        position.deactivate();
        positionRepository.save(position);
        log.info("Position deleted (deactivated): id={}", id);
    }

    private Position findById(UUID id) {
        return positionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("ORG_003", "직책을 찾을 수 없습니다: " + id));
    }
}
