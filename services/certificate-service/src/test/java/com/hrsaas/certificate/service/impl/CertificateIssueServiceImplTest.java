package com.hrsaas.certificate.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.CertificateRequestRepository;
import com.hrsaas.certificate.repository.CertificateTemplateRepository;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class CertificateIssueServiceImplTest {

    @Mock
    private CertificateIssueRepository certificateIssueRepository;
    @Mock
    private CertificateRequestRepository certificateRequestRepository;
    @Mock
    private CertificateTemplateRepository certificateTemplateRepository;

    @InjectMocks
    private CertificateIssueServiceImpl certificateIssueService;

    @Test
    @DisplayName("Verification code generation should match expected format")
    void generateVerificationCode() {
        // When
        String verificationCode = (String) ReflectionTestUtils.invokeMethod(certificateIssueService, "generateVerificationCode");

        // Then
        assertThat(verificationCode).isNotNull();
        // The format is XXXX-XXXX-XXXX, length = 12 chars + 2 hyphens = 14
        assertThat(verificationCode).hasSize(14);
        assertThat(verificationCode).matches("^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$");
    }
}
