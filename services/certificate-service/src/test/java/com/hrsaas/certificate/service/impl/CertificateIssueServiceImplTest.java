package com.hrsaas.certificate.service.impl;

import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

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

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Issue number generation should start from 1 when no previous record exists")
    void generateIssueNumber_First() {
        // Given
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String expectedPrefix = String.format("CERT-%s-", datePrefix);

        given(certificateIssueRepository.findLatestIssueNumbers(eq(tenantId), anyString(), any(org.springframework.data.domain.Pageable.class)))
                .willReturn(Collections.emptyList());

        // When
        String issueNumber = (String) ReflectionTestUtils.invokeMethod(certificateIssueService, "generateIssueNumber");

        // Then
        assertThat(issueNumber).isNotNull();
        assertThat(issueNumber).startsWith(expectedPrefix);
        assertThat(issueNumber).endsWith("000001");
    }

    @Test
    @DisplayName("Issue number generation should increment correctly")
    void generateIssueNumber_Increment() {
        // Given
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String expectedPrefix = String.format("CERT-%s-", datePrefix);
        String currentMax = expectedPrefix + "000042";

        given(certificateIssueRepository.findLatestIssueNumbers(eq(tenantId), anyString(), any(org.springframework.data.domain.Pageable.class)))
                .willReturn(List.of(currentMax));

        // When
        String issueNumber = (String) ReflectionTestUtils.invokeMethod(certificateIssueService, "generateIssueNumber");

        // Then
        assertThat(issueNumber).isNotNull();
        assertThat(issueNumber).isEqualTo(expectedPrefix + "000043");
    }

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
