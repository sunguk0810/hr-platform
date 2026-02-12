package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.client.TenantClient;
import com.hrsaas.certificate.domain.dto.client.TenantInfoResponse;
import com.hrsaas.certificate.domain.dto.request.VerifyCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.VerificationResultResponse;
import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.VerificationLogRepository;
import com.hrsaas.common.response.ApiResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CertificateVerificationServiceImplTest {

    @Mock
    private CertificateIssueRepository certificateIssueRepository;
    @Mock
    private VerificationLogRepository verificationLogRepository;
    @Mock
    private TenantClient tenantClient;

    @InjectMocks
    private CertificateVerificationServiceImpl certificateVerificationService;

    @Test
    @DisplayName("Verify valid certificate and fetch tenant name")
    void verify_ValidCertificate_ReturnsTenantName() {
        // Given
        String verificationCode = "1234-5678-9012";
        UUID tenantId = UUID.randomUUID();
        String companyName = "Acme Corp";

        CertificateType type = CertificateType.builder()
                .name("Employment Certificate")
                .build();

        CertificateRequest request = CertificateRequest.builder()
                .certificateType(type)
                .employeeName("John Doe")
                .build();

        CertificateIssue issue = CertificateIssue.builder()
                .request(request)
                .issueNumber("CERT-001")
                .verificationCode(verificationCode)
                .expiresAt(LocalDate.now().plusDays(1))
                .build();

        // Manually set tenantId since it's typically set by JPA/Aspect
        ReflectionTestUtils.setField(issue, "tenantId", tenantId);

        given(certificateIssueRepository.findByVerificationCode(verificationCode))
                .willReturn(Optional.of(issue));

        given(tenantClient.getInternalInfo(tenantId))
                .willReturn(ApiResponse.success(TenantInfoResponse.builder()
                        .id(tenantId)
                        .name(companyName)
                        .build()));

        VerifyCertificateRequest verifyRequest = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        // When
        VerificationResultResponse response = certificateVerificationService.verify(verifyRequest, "127.0.0.1", "TestAgent");

        // Then
        assertThat(response.isValid()).isTrue();
        assertThat(response.getIssuingOrganization()).isEqualTo(companyName);
        verify(tenantClient).getInternalInfo(tenantId);
        verify(verificationLogRepository).save(any());
    }

    @Test
    @DisplayName("Verify valid certificate but tenant service fails - returns default name")
    void verify_TenantServiceFails_ReturnsDefaultName() {
        // Given
        String verificationCode = "1234-5678-9012";
        UUID tenantId = UUID.randomUUID();

        CertificateType type = CertificateType.builder()
                .name("Employment Certificate")
                .build();

        CertificateRequest request = CertificateRequest.builder()
                .certificateType(type)
                .employeeName("John Doe")
                .build();

        CertificateIssue issue = CertificateIssue.builder()
                .request(request)
                .issueNumber("CERT-001")
                .verificationCode(verificationCode)
                .expiresAt(LocalDate.now().plusDays(1))
                .build();

        ReflectionTestUtils.setField(issue, "tenantId", tenantId);

        given(certificateIssueRepository.findByVerificationCode(verificationCode))
                .willReturn(Optional.of(issue));

        given(tenantClient.getInternalInfo(tenantId))
                .willThrow(new RuntimeException("Service unavailable"));

        VerifyCertificateRequest verifyRequest = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        // When
        VerificationResultResponse response = certificateVerificationService.verify(verifyRequest, "127.0.0.1", "TestAgent");

        // Then
        assertThat(response.isValid()).isTrue();
        assertThat(response.getIssuingOrganization()).isEqualTo("회사명"); // Default fallback
        verify(tenantClient).getInternalInfo(tenantId);
    }
}
