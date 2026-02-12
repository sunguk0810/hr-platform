package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import com.hrsaas.certificate.repository.CertificateTemplateRepository;
import com.hrsaas.certificate.service.PdfGenerationService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import com.lowagie.text.pdf.BaseFont;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGenerationServiceImpl implements PdfGenerationService {

    private final CertificateTemplateRepository certificateTemplateRepository;

    @Qualifier("stringTemplateEngine")
    private final TemplateEngine templateEngine;

    @Override
    public byte[] generatePdf(CertificateIssue issue) {
        log.info("Generating PDF for certificate issue: {}", issue.getIssueNumber());

        UUID templateId = issue.getRequest().getCertificateType().getTemplateId();
        if (templateId == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "증명서 유형에 템플릿이 지정되지 않았습니다");
        }

        CertificateTemplate template = certificateTemplateRepository.findById(templateId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "템플릿을 찾을 수 없습니다: " + templateId));

        // Prepare context
        Context context = new Context();
        Map<String, Object> snapshot = issue.getContentSnapshot();
        if (snapshot != null) {
            context.setVariables(snapshot);
        }

        // Add system variables
        context.setVariable("issueNumber", issue.getIssueNumber());
        context.setVariable("verificationCode", issue.getVerificationCode());
        if (issue.getIssuedAt() != null) {
            context.setVariable("issuedAt", issue.getIssuedAt());
        }
        if (issue.getExpiresAt() != null) {
            context.setVariable("expiresAt", issue.getExpiresAt());
        }
        if (issue.getIssuedBy() != null) {
            context.setVariable("issuedBy", issue.getIssuedBy());
        }

        // Build HTML template
        String fullHtml = buildFullHtml(template);
        String processedHtml = templateEngine.process(fullHtml, context);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();

            // Font handling
            registerFonts(renderer);

            renderer.setDocumentFromString(processedHtml);
            renderer.layout();
            renderer.createPDF(os);
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF for issue: {}", issue.getIssueNumber(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "PDF 생성 중 오류가 발생했습니다");
        }
    }

    private String buildFullHtml(CertificateTemplate template) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n<html xmlns:th=\"http://www.thymeleaf.org\">\n<head>\n");
        sb.append("<meta charset=\"UTF-8\"/>\n");
        sb.append("<style>\n");
        sb.append("body { font-family: 'Malgun Gothic', 'AppleGothic', sans-serif; }\n");
        sb.append("@page { size: ").append(template.getPageSize() != null ? template.getPageSize() : "A4").append("; margin: 20mm; }\n");
        if (template.getCssStyles() != null) {
            sb.append(template.getCssStyles());
        }
        sb.append("\n</style>\n</head>\n<body>\n");

        if (template.getHeaderHtml() != null) {
            sb.append("<div id='header'>").append(template.getHeaderHtml()).append("</div>\n");
        }

        sb.append("<div id='content'>").append(template.getContentHtml()).append("</div>\n");

        if (template.getFooterHtml() != null) {
            sb.append("<div id='footer'>").append(template.getFooterHtml()).append("</div>\n");
        }

        sb.append("</body>\n</html>");
        return sb.toString();
    }

    private void registerFonts(ITextRenderer renderer) {
        // Try to load Nanum fonts commonly found in Linux/Docker environments
        String[] fontPaths = {
                "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
                "/usr/share/fonts/nanum/NanumGothic.ttf",
                "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
                "C:/Windows/Fonts/malgun.ttf" // For local Windows dev
        };

        boolean fontLoaded = false;
        for (String path : fontPaths) {
            File fontFile = new File(path);
            if (fontFile.exists()) {
                try {
                    renderer.getFontResolver().addFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    log.debug("Loaded font: {}", path);
                    fontLoaded = true;
                } catch (Exception e) {
                    log.warn("Failed to load font: {}", path, e);
                }
            }
        }

        if (!fontLoaded) {
            log.warn("No suitable Korean font found in system paths. PDF generation may not display Korean characters correctly.");
        }
    }
}
