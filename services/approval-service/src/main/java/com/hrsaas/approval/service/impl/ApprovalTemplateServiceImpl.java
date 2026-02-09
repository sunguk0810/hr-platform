package com.hrsaas.approval.service.impl;

import com.hrsaas.approval.domain.dto.request.ApprovalTemplateLineRequest;
import com.hrsaas.approval.domain.dto.request.CreateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.request.UpdateApprovalTemplateRequest;
import com.hrsaas.approval.domain.dto.response.ApprovalTemplateResponse;
import com.hrsaas.approval.domain.entity.ApprovalTemplate;
import com.hrsaas.approval.domain.entity.ApprovalTemplateLine;
import com.hrsaas.approval.repository.ApprovalTemplateRepository;
import com.hrsaas.approval.service.ApprovalTemplateService;
import com.hrsaas.common.cache.CacheNames;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApprovalTemplateServiceImpl implements ApprovalTemplateService {

    private final ApprovalTemplateRepository approvalTemplateRepository;

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.APPROVAL_TEMPLATE, allEntries = true)
    public ApprovalTemplateResponse create(CreateApprovalTemplateRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (approvalTemplateRepository.existsByCodeAndTenantId(request.getCode(), tenantId)) {
            throw new DuplicateException("APV_004", "이미 존재하는 템플릿 코드입니다: " + request.getCode());
        }

        ApprovalTemplate template = ApprovalTemplate.builder()
            .code(request.getCode())
            .name(request.getName())
            .documentType(request.getDocumentType())
            .description(request.getDescription())
            .sortOrder(request.getSortOrder())
            .build();

        for (ApprovalTemplateLineRequest lineRequest : request.getTemplateLines()) {
            ApprovalTemplateLine line = ApprovalTemplateLine.builder()
                .lineType(lineRequest.getLineType())
                .approverType(lineRequest.getApproverType())
                .approverId(lineRequest.getApproverId())
                .approverName(lineRequest.getApproverName())
                .positionCode(lineRequest.getPositionCode())
                .departmentId(lineRequest.getDepartmentId())
                .description(lineRequest.getDescription())
                .build();
            template.addTemplateLine(line);
        }

        ApprovalTemplate saved = approvalTemplateRepository.save(template);
        log.info("Approval template created: id={}, code={}", saved.getId(), saved.getCode());

        return ApprovalTemplateResponse.from(saved);
    }

    @Override
    @Cacheable(value = CacheNames.APPROVAL_TEMPLATE,
               key = "T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant() + ':' + #id")
    public ApprovalTemplateResponse getById(UUID id) {
        ApprovalTemplate template = findById(id);
        return ApprovalTemplateResponse.from(template);
    }

    @Override
    public ApprovalTemplateResponse getByCode(String code) {
        UUID tenantId = TenantContext.getCurrentTenant();
        ApprovalTemplate template = approvalTemplateRepository.findByCodeAndTenantId(code, tenantId)
            .orElseThrow(() -> new NotFoundException("APV_004", "결재 템플릿을 찾을 수 없습니다: " + code));
        return ApprovalTemplateResponse.from(template);
    }

    @Override
    @Cacheable(value = CacheNames.APPROVAL_TEMPLATE,
               key = "'all:' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<ApprovalTemplateResponse> getAll() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<ApprovalTemplate> templates = approvalTemplateRepository.findAllByTenantIdWithLines(tenantId);

        return templates.stream()
            .map(ApprovalTemplateResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = CacheNames.APPROVAL_TEMPLATE,
               key = "'active:' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<ApprovalTemplateResponse> getActive() {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<ApprovalTemplate> templates = approvalTemplateRepository.findActiveByTenantIdWithLines(tenantId);

        return templates.stream()
            .map(ApprovalTemplateResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = CacheNames.APPROVAL_TEMPLATE,
               key = "'docType:' + #documentType + ':' + T(com.hrsaas.common.tenant.TenantContext).getCurrentTenant()",
               unless = "#result == null || #result.isEmpty()")
    public List<ApprovalTemplateResponse> getByDocumentType(String documentType) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<ApprovalTemplate> templates = approvalTemplateRepository.findByTenantIdAndDocumentTypeWithLines(
            tenantId, documentType);

        return templates.stream()
            .map(ApprovalTemplateResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.APPROVAL_TEMPLATE, allEntries = true)
    public ApprovalTemplateResponse update(UUID id, UpdateApprovalTemplateRequest request) {
        ApprovalTemplate template = findById(id);

        template.update(request.getName(), request.getDescription(), request.getSortOrder());

        if (request.getIsActive() != null) {
            if (request.getIsActive()) {
                template.activate();
            } else {
                template.deactivate();
            }
        }

        if (request.getTemplateLines() != null && !request.getTemplateLines().isEmpty()) {
            template.clearTemplateLines();
            for (ApprovalTemplateLineRequest lineRequest : request.getTemplateLines()) {
                ApprovalTemplateLine line = ApprovalTemplateLine.builder()
                    .lineType(lineRequest.getLineType())
                    .approverType(lineRequest.getApproverType())
                    .approverId(lineRequest.getApproverId())
                    .approverName(lineRequest.getApproverName())
                    .positionCode(lineRequest.getPositionCode())
                    .departmentId(lineRequest.getDepartmentId())
                    .description(lineRequest.getDescription())
                    .build();
                template.addTemplateLine(line);
            }
        }

        ApprovalTemplate saved = approvalTemplateRepository.save(template);
        log.info("Approval template updated: id={}", id);

        return ApprovalTemplateResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheNames.APPROVAL_TEMPLATE, allEntries = true)
    public void delete(UUID id) {
        ApprovalTemplate template = findById(id);
        template.deactivate();
        approvalTemplateRepository.save(template);
        log.info("Approval template deleted (deactivated): id={}", id);
    }

    private ApprovalTemplate findById(UUID id) {
        return approvalTemplateRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("APV_004", "결재 템플릿을 찾을 수 없습니다: " + id));
    }
}
