package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTypeRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTypeResponse;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.repository.CertificateTypeRepository;
import com.hrsaas.certificate.service.CertificateTypeService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 증명서 유형 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateTypeServiceImpl implements CertificateTypeService {

    private final CertificateTypeRepository certificateTypeRepository;

    @Override
    @Transactional
    @CacheEvict(value = "certificateTypes", allEntries = true)
    public CertificateTypeResponse create(CreateCertificateTypeRequest request) {
        log.info("Creating certificate type: {}", request.getCode());

        if (certificateTypeRepository.existsByCode(request.getCode())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 증명서 유형 코드입니다: " + request.getCode());
        }

        CertificateType certificateType = CertificateType.builder()
                .code(request.getCode())
                .name(request.getName())
                .nameEn(request.getNameEn())
                .description(request.getDescription())
                .templateId(request.getTemplateId())
                .requiresApproval(request.isRequiresApproval())
                .autoIssue(request.isAutoIssue())
                .validDays(request.getValidDays())
                .fee(request.getFee())
                .maxCopiesPerRequest(request.getMaxCopiesPerRequest())
                .sortOrder(request.getSortOrder())
                .build();

        if (request.getApprovalTemplateId() != null) {
            certificateType.setApprovalTemplateId(request.getApprovalTemplateId());
        }

        CertificateType saved = certificateTypeRepository.save(certificateType);
        log.info("Certificate type created: {}", saved.getId());

        return CertificateTypeResponse.from(saved);
    }

    @Override
    @Cacheable(value = "certificateType", key = "#id")
    public CertificateTypeResponse getById(UUID id) {
        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + id));
        return CertificateTypeResponse.from(certificateType);
    }

    @Override
    @Cacheable(value = "certificateType", key = "#code")
    public CertificateTypeResponse getByCode(String code) {
        CertificateType certificateType = certificateTypeRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + code));
        return CertificateTypeResponse.from(certificateType);
    }

    @Override
    public List<CertificateTypeResponse> getAll() {
        return certificateTypeRepository.findAll().stream()
                .map(CertificateTypeResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "certificateTypes", key = "'active'")
    public List<CertificateTypeResponse> getActiveTypes() {
        return certificateTypeRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(CertificateTypeResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateType", "certificateTypes"}, allEntries = true)
    public CertificateTypeResponse update(UUID id, UpdateCertificateTypeRequest request) {
        log.info("Updating certificate type: {}", id);

        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + id));

        if (request.getName() != null) {
            certificateType.setName(request.getName());
        }
        if (request.getNameEn() != null) {
            certificateType.setNameEn(request.getNameEn());
        }
        if (request.getDescription() != null) {
            certificateType.setDescription(request.getDescription());
        }
        if (request.getTemplateId() != null) {
            certificateType.setTemplateId(request.getTemplateId());
        }
        if (request.getRequiresApproval() != null) {
            certificateType.setRequiresApproval(request.getRequiresApproval());
        }
        if (request.getApprovalTemplateId() != null) {
            certificateType.setApprovalTemplateId(request.getApprovalTemplateId());
        }
        if (request.getAutoIssue() != null) {
            certificateType.setAutoIssue(request.getAutoIssue());
        }
        if (request.getValidDays() != null) {
            certificateType.setValidDays(request.getValidDays());
        }
        if (request.getFee() != null) {
            certificateType.setFee(request.getFee());
        }
        if (request.getMaxCopiesPerRequest() != null) {
            certificateType.setMaxCopiesPerRequest(request.getMaxCopiesPerRequest());
        }
        if (request.getSortOrder() != null) {
            certificateType.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            certificateType.setActive(request.getActive());
        }

        CertificateType saved = certificateTypeRepository.save(certificateType);
        log.info("Certificate type updated: {}", saved.getId());

        return CertificateTypeResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateType", "certificateTypes"}, allEntries = true)
    public void delete(UUID id) {
        log.info("Deleting certificate type: {}", id);

        if (!certificateTypeRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + id);
        }

        certificateTypeRepository.deleteById(id);
        log.info("Certificate type deleted: {}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateType", "certificateTypes"}, allEntries = true)
    public void activate(UUID id) {
        log.info("Activating certificate type: {}", id);

        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + id));

        certificateType.activate();
        certificateTypeRepository.save(certificateType);
        log.info("Certificate type activated: {}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateType", "certificateTypes"}, allEntries = true)
    public void deactivate(UUID id) {
        log.info("Deactivating certificate type: {}", id);

        CertificateType certificateType = certificateTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형을 찾을 수 없습니다: " + id));

        certificateType.deactivate();
        certificateTypeRepository.save(certificateType);
        log.info("Certificate type deactivated: {}", id);
    }

    @Override
    public List<CertificateTypeResponse> search(String keyword) {
        return certificateTypeRepository.searchByName(keyword).stream()
                .map(CertificateTypeResponse::from)
                .collect(Collectors.toList());
    }
}
