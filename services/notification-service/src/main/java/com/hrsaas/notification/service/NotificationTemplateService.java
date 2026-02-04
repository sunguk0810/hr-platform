package com.hrsaas.notification.service;

import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationTemplate;
import com.hrsaas.notification.domain.entity.NotificationType;
import com.hrsaas.notification.repository.NotificationTemplateRepository;
import com.hrsaas.notification.template.TemplateRenderer;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationTemplateService {

    private final NotificationTemplateRepository templateRepository;
    private final TemplateRenderer templateRenderer;

    public PageResponse<NotificationTemplate> getTemplates(Pageable pageable) {
        UUID tenantId = TenantContext.getCurrentTenant();
        Page<NotificationTemplate> page = templateRepository.findAllActiveByTenantId(tenantId, pageable);
        return PageResponse.from(page, page.getContent());
    }

    public NotificationTemplate getTemplate(UUID templateId) {
        return templateRepository.findById(templateId)
            .orElseThrow(() -> new NotFoundException("NTF_T01", "템플릿을 찾을 수 없습니다: " + templateId));
    }

    public NotificationTemplate getTemplateByCode(String code, NotificationChannel channel) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return templateRepository.findByTenantIdAndCodeAndChannel(tenantId, code, channel)
            .orElseThrow(() -> new NotFoundException("NTF_T02", "템플릿을 찾을 수 없습니다: " + code));
    }

    public NotificationTemplate getTemplateByType(NotificationType type, NotificationChannel channel) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return templateRepository.findByTenantIdAndTypeAndChannel(tenantId, type, channel)
            .orElse(null);
    }

    @Transactional
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        UUID tenantId = TenantContext.getCurrentTenant();
        template.setTenantId(tenantId);

        if (templateRepository.existsByTenantIdAndCodeAndChannel(tenantId, template.getCode(), template.getChannel())) {
            throw new IllegalArgumentException("동일한 코드와 채널의 템플릿이 이미 존재합니다: " + template.getCode());
        }

        log.info("Creating notification template: code={}, type={}, channel={}",
            template.getCode(), template.getNotificationType(), template.getChannel());

        return templateRepository.save(template);
    }

    @Transactional
    public NotificationTemplate updateTemplate(UUID templateId, NotificationTemplate updated) {
        NotificationTemplate template = getTemplate(templateId);

        template.setName(updated.getName());
        template.setSubject(updated.getSubject());
        template.setBodyTemplate(updated.getBodyTemplate());
        template.setDescription(updated.getDescription());
        template.setVariables(updated.getVariables());
        template.setIsActive(updated.getIsActive());

        log.info("Updated notification template: id={}", templateId);

        return templateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(UUID templateId) {
        NotificationTemplate template = getTemplate(templateId);
        template.setIsActive(false);
        templateRepository.save(template);
        log.info("Deactivated notification template: id={}", templateId);
    }

    /**
     * Renders a template with the given variables.
     */
    public RenderedTemplate renderTemplate(String code, NotificationChannel channel, Map<String, Object> variables) {
        NotificationTemplate template = getTemplateByCode(code, channel);
        return renderTemplate(template, variables);
    }

    /**
     * Renders a template with the given variables.
     */
    public RenderedTemplate renderTemplate(NotificationTemplate template, Map<String, Object> variables) {
        String subject = templateRenderer.render(template.getSubject(), variables);
        String body = templateRenderer.render(template.getBodyTemplate(), variables);

        return new RenderedTemplate(subject, body);
    }

    public record RenderedTemplate(String subject, String body) {}
}
