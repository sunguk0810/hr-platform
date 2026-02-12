package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateTemplate;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.repository.CertificateTemplateRepository;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.core.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class PdfGenerationServiceImplTest {

    @Mock
    private CertificateTemplateRepository certificateTemplateRepository;

    @Mock
    private TemplateEngine templateEngine;

    @InjectMocks
    private PdfGenerationServiceImpl pdfGenerationService;

    @Test
    @DisplayName("generatePdf throws exception when templateId is missing")
    void generatePdf_NoTemplateId() {
        // Given
        CertificateIssue issue = mock(CertificateIssue.class);
        CertificateRequest request = mock(CertificateRequest.class);
        CertificateType type = mock(CertificateType.class);

        given(issue.getRequest()).willReturn(request);
        given(request.getCertificateType()).willReturn(type);
        given(type.getTemplateId()).willReturn(null);
        given(issue.getIssueNumber()).willReturn("CERT-TEST");

        // When/Then
        assertThatThrownBy(() -> pdfGenerationService.generatePdf(issue))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND.getCode());
    }

    @Test
    @DisplayName("generatePdf throws exception when template is not found")
    void generatePdf_TemplateNotFound() {
        // Given
        UUID templateId = UUID.randomUUID();
        CertificateIssue issue = mock(CertificateIssue.class);
        CertificateRequest request = mock(CertificateRequest.class);
        CertificateType type = mock(CertificateType.class);

        given(issue.getRequest()).willReturn(request);
        given(request.getCertificateType()).willReturn(type);
        given(type.getTemplateId()).willReturn(templateId);
        given(issue.getIssueNumber()).willReturn("CERT-TEST");

        given(certificateTemplateRepository.findById(templateId)).willReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> pdfGenerationService.generatePdf(issue))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESOURCE_NOT_FOUND.getCode());
    }

    @Test
    @DisplayName("generatePdf generates PDF successfully")
    void generatePdf_Success() {
        // Given
        UUID templateId = UUID.randomUUID();
        CertificateIssue issue = mock(CertificateIssue.class);
        CertificateRequest request = mock(CertificateRequest.class);
        CertificateType type = mock(CertificateType.class);
        CertificateTemplate template = mock(CertificateTemplate.class);

        given(issue.getRequest()).willReturn(request);
        given(issue.getIssueNumber()).willReturn("CERT-001");
        given(issue.getContentSnapshot()).willReturn(new HashMap<>());
        given(request.getCertificateType()).willReturn(type);
        given(type.getTemplateId()).willReturn(templateId);

        given(certificateTemplateRepository.findById(templateId)).willReturn(Optional.of(template));

        // Mock template content
        given(template.getPageSize()).willReturn("A4");
        given(template.getCssStyles()).willReturn("body { color: black; }");
        given(template.getHeaderHtml()).willReturn("Header");
        given(template.getContentHtml()).willReturn("Content");
        given(template.getFooterHtml()).willReturn("Footer");

        given(templateEngine.process(anyString(), any(Context.class))).willReturn("<html><body>Test PDF</body></html>");

        // When
        byte[] pdf = pdfGenerationService.generatePdf(issue);

        // Then
        assertThat(pdf).isNotEmpty();
        // Since ITextRenderer generates a PDF, the byte array should start with %PDF header
        // %PDF-1.4 (or similar)
        assertThat(pdf).startsWith("%PDF".getBytes());
    }
}
