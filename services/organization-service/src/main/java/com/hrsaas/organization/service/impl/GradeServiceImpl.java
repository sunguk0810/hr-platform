package com.hrsaas.organization.service.impl;

import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.organization.domain.dto.request.CreateGradeRequest;
import com.hrsaas.organization.domain.dto.request.UpdateGradeRequest;
import com.hrsaas.organization.domain.dto.response.GradeResponse;
import com.hrsaas.organization.domain.entity.Grade;
import com.hrsaas.organization.repository.GradeRepository;
import com.hrsaas.organization.service.GradeService;
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
public class GradeServiceImpl implements GradeService {

    private final GradeRepository gradeRepository;

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.GRADE, allEntries = true)
    public GradeResponse create(CreateGradeRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (gradeRepository.existsByCodeAndTenantId(request.getCode(), tenantId)) {
            throw new DuplicateException("ORG_002", "이미 존재하는 직급 코드입니다: " + request.getCode());
        }

        Grade grade = Grade.builder()
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .level(request.getLevel())
            .sortOrder(request.getSortOrder())
            .build();

        Grade saved = gradeRepository.save(grade);
        log.info("Grade created: id={}, code={}", saved.getId(), saved.getCode());

        return GradeResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.GRADE, key = "#id")
    public GradeResponse getById(UUID id) {
        Grade grade = findById(id);
        return GradeResponse.from(grade);
    }

    @Override
    public GradeResponse getByCode(String code) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Grade grade = gradeRepository.findByCodeAndTenantId(code, tenantId)
            .orElseThrow(() -> new NotFoundException("ORG_002", "직급을 찾을 수 없습니다: " + code));
        return GradeResponse.from(grade);
    }

    @Override
    public List<GradeResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Grade> grades = gradeRepository.findAllByTenantId(tenantId);

        return grades.stream()
            .map(GradeResponse::from)
            .toList();
    }

    @Override
    public List<GradeResponse> getActive() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Grade> grades = gradeRepository.findActiveByTenantId(tenantId);

        return grades.stream()
            .map(GradeResponse::from)
            .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.GRADE, allEntries = true)
    public GradeResponse update(UUID id, UpdateGradeRequest request) {
        Grade grade = findById(id);

        grade.update(request.getName(), request.getNameEn(), request.getLevel(), request.getSortOrder());

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                grade.activate();
            } else {
                grade.deactivate();
            }
        }

        Grade saved = gradeRepository.save(grade);
        log.info("Grade updated: id={}", id);

        return GradeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.GRADE, allEntries = true)
    public void delete(UUID id) {
        Grade grade = findById(id);
        grade.deactivate();
        gradeRepository.save(grade);
        log.info("Grade deleted (deactivated): id={}", id);
    }

    private Grade findById(UUID id) {
        return gradeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("ORG_002", "직급을 찾을 수 없습니다: " + id));
    }
}
