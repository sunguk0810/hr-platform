package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.common.core.exception.BusinessException;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.then;
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

    @Test
    @DisplayName("downloadPdf should return non-empty PDF bytes for valid certificate")
    void downloadPdf_validCertificate_returnsPdfBytes() {
        UUID issueId = UUID.randomUUID();
        CertificateIssue issue = CertificateIssue.builder()
                .request(null)
                .issueNumber("CERT-20260212-000001")
                .verificationCode("ABCD-EFGH-IJKL")
                .issuedBy(UUID.randomUUID())
                .expiresAt(java.time.LocalDate.now().plusDays(30))
                .contentSnapshot(new HashMap<>())
                .build();
        ReflectionTestUtils.setField(issue, "id", issueId);

        given(certificateIssueRepository.findById(issueId)).willReturn(java.util.Optional.of(issue));

        byte[] pdf = certificateIssueService.downloadPdf(issueId);

        assertThat(pdf).isNotNull();
        assertThat(pdf.length).isGreaterThan(0);
    }

    @Test
    @DisplayName("downloadPdf should throw when certificate is expired")
    void downloadPdf_expiredCertificate_throwsBusinessException() {
        UUID issueId = UUID.randomUUID();
        CertificateIssue issue = CertificateIssue.builder()
                .request(null)
                .issueNumber("CERT-20260212-000002")
                .verificationCode("ZZZZ-YYYY-XXXX")
                .issuedBy(UUID.randomUUID())
                .expiresAt(java.time.LocalDate.now().minusDays(1))
                .contentSnapshot(new HashMap<>())
                .build();
        ReflectionTestUtils.setField(issue, "id", issueId);

        given(certificateIssueRepository.findById(issueId)).willReturn(java.util.Optional.of(issue));

        assertThatThrownBy(() -> certificateIssueService.downloadPdf(issueId))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("getByEmployeeId with filters should route to repository filter query")
    void getByEmployeeId_withFilters_usesFilterRepositoryMethod() {
        UUID employeeId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        LocalDate today = LocalDate.now();

        given(certificateIssueRepository.findByEmployeeIdWithFilter(
                eq(employeeId),
                eq("EMPLOYMENT"),
                eq(false),
                eq(today),
                eq(pageable)))
                .willReturn(new PageImpl<>(List.of(), pageable, 0));

        certificateIssueService.getByEmployeeId(employeeId, "EMPLOYMENT", false, pageable);

        then(certificateIssueRepository).should()
                .findByEmployeeIdWithFilter(employeeId, "EMPLOYMENT", false, today, pageable);
    }
}
