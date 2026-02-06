package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.request.UpdateCertificateTemplateRequest;
import com.hrsaas.certificate.domain.dto.response.CertificateTemplateResponse;
import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import com.hrsaas.certificate.repository.CertificateTemplateRepository;
import com.hrsaas.certificate.service.CertificateTemplateService;
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
 * 증명서 템플릿 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CertificateTemplateServiceImpl implements CertificateTemplateService {

    private final CertificateTemplateRepository certificateTemplateRepository;

    @Override
    @Transactional
    @CacheEvict(value = "certificateTemplates", allEntries = true)
    public CertificateTemplateResponse create(CreateCertificateTemplateRequest request) {
        log.info("Creating certificate template: {}", request.getName());

        if (certificateTemplateRepository.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 템플릿명입니다: " + request.getName());
        }

        CertificateTemplate template = CertificateTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .contentHtml(request.getContentHtml())
                .headerHtml(request.getHeaderHtml())
                .footerHtml(request.getFooterHtml())
                .cssStyles(request.getCssStyles())
                .pageSize(request.getPageSize())
                .orientation(request.getOrientation())
                .marginTop(request.getMarginTop())
                .marginBottom(request.getMarginBottom())
                .marginLeft(request.getMarginLeft())
                .marginRight(request.getMarginRight())
                .variables(request.getVariables())
                .includeCompanySeal(request.isIncludeCompanySeal())
                .includeSignature(request.isIncludeSignature())
                .build();

        CertificateTemplate saved = certificateTemplateRepository.save(template);
        log.info("Certificate template created: {}", saved.getId());

        return CertificateTemplateResponse.from(saved);
    }

    @Override
    @Cacheable(value = "certificateTemplate", key = "#id")
    public CertificateTemplateResponse getById(UUID id) {
        CertificateTemplate template = certificateTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id));
        return CertificateTemplateResponse.from(template);
    }

    @Override
    @Cacheable(value = "certificateTemplate", key = "#name")
    public CertificateTemplateResponse getByName(String name) {
        CertificateTemplate template = certificateTemplateRepository.findByName(name)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + name));
        return CertificateTemplateResponse.from(template);
    }

    @Override
    public List<CertificateTemplateResponse> getAll() {
        return certificateTemplateRepository.findAll().stream()
                .map(CertificateTemplateResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "certificateTemplates", key = "'active'", unless = "#result == null || #result.isEmpty()")
    public List<CertificateTemplateResponse> getActiveTemplates() {
        return certificateTemplateRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(CertificateTemplateResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateTemplate", "certificateTemplates"}, allEntries = true)
    public CertificateTemplateResponse update(UUID id, UpdateCertificateTemplateRequest request) {
        log.info("Updating certificate template: {}", id);

        CertificateTemplate template = certificateTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id));

        if (request.getName() != null) {
            if (!template.getName().equals(request.getName()) && certificateTemplateRepository.existsByName(request.getName())) {
                throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE, "이미 존재하는 템플릿명입니다: " + request.getName());
            }
            template.setName(request.getName());
        }
        if (request.getDescription() != null) {
            template.setDescription(request.getDescription());
        }
        if (request.getContentHtml() != null) {
            template.setContentHtml(request.getContentHtml());
        }
        if (request.getHeaderHtml() != null) {
            template.setHeaderHtml(request.getHeaderHtml());
        }
        if (request.getFooterHtml() != null) {
            template.setFooterHtml(request.getFooterHtml());
        }
        if (request.getCssStyles() != null) {
            template.setCssStyles(request.getCssStyles());
        }
        if (request.getPageSize() != null) {
            template.setPageSize(request.getPageSize());
        }
        if (request.getOrientation() != null) {
            template.setOrientation(request.getOrientation());
        }
        if (request.getMarginTop() != null) {
            template.setMarginTop(request.getMarginTop());
        }
        if (request.getMarginBottom() != null) {
            template.setMarginBottom(request.getMarginBottom());
        }
        if (request.getMarginLeft() != null) {
            template.setMarginLeft(request.getMarginLeft());
        }
        if (request.getMarginRight() != null) {
            template.setMarginRight(request.getMarginRight());
        }
        if (request.getVariables() != null) {
            template.setVariables(request.getVariables());
        }
        if (request.getIncludeCompanySeal() != null) {
            template.setIncludeCompanySeal(request.getIncludeCompanySeal());
        }
        if (request.getIncludeSignature() != null) {
            template.setIncludeSignature(request.getIncludeSignature());
        }
        if (request.getSealImageUrl() != null) {
            template.setSealImageUrl(request.getSealImageUrl());
        }
        if (request.getSignatureImageUrl() != null) {
            template.setSignatureImageUrl(request.getSignatureImageUrl());
        }
        if (request.getSampleImageUrl() != null) {
            template.setSampleImageUrl(request.getSampleImageUrl());
        }
        if (request.getActive() != null) {
            template.setActive(request.getActive());
        }

        CertificateTemplate saved = certificateTemplateRepository.save(template);
        log.info("Certificate template updated: {}", saved.getId());

        return CertificateTemplateResponse.from(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateTemplate", "certificateTemplates"}, allEntries = true)
    public void delete(UUID id) {
        log.info("Deleting certificate template: {}", id);

        if (!certificateTemplateRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id);
        }

        certificateTemplateRepository.deleteById(id);
        log.info("Certificate template deleted: {}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateTemplate", "certificateTemplates"}, allEntries = true)
    public void activate(UUID id) {
        log.info("Activating certificate template: {}", id);

        CertificateTemplate template = certificateTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id));

        template.setActive(true);
        certificateTemplateRepository.save(template);
        log.info("Certificate template activated: {}", id);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"certificateTemplate", "certificateTemplates"}, allEntries = true)
    public void deactivate(UUID id) {
        log.info("Deactivating certificate template: {}", id);

        CertificateTemplate template = certificateTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id));

        template.setActive(false);
        certificateTemplateRepository.save(template);
        log.info("Certificate template deactivated: {}", id);
    }

    @Override
    public List<CertificateTemplateResponse> search(String keyword) {
        return certificateTemplateRepository.searchByName(keyword).stream()
                .map(CertificateTemplateResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public String generatePreviewHtml(UUID id) {
        CertificateTemplate template = certificateTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + id));

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<style>");
        if (template.getCssStyles() != null) {
            html.append(template.getCssStyles());
        }
        html.append("</style></head><body>");

        if (template.getHeaderHtml() != null) {
            html.append("<header>").append(template.getHeaderHtml()).append("</header>");
        }

        html.append("<main>").append(template.getContentHtml()).append("</main>");

        if (template.getFooterHtml() != null) {
            html.append("<footer>").append(template.getFooterHtml()).append("</footer>");
        }

        html.append("</body></html>");

        return html.toString();
    }
}
