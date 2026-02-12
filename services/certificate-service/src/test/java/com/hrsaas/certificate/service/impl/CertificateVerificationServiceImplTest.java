package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.client.TenantServiceClient;
import com.hrsaas.certificate.client.dto.TenantClientResponse;
import com.hrsaas.certificate.domain.dto.request.VerifyCertificateRequest;
import com.hrsaas.certificate.domain.dto.response.VerificationResultResponse;
import com.hrsaas.certificate.domain.entity.CertificateIssue;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.repository.CertificateIssueRepository;
import com.hrsaas.certificate.repository.VerificationLogRepository;
import com.hrsaas.common.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CertificateVerificationServiceImplTest {

    @Mock
    private CertificateIssueRepository certificateIssueRepository;
    @Mock
    private VerificationLogRepository verificationLogRepository;
    @Mock
    private TenantServiceClient tenantServiceClient;

    @InjectMocks
    private CertificateVerificationServiceImpl verificationService;

    private CertificateIssue certificateIssue;
    private final UUID tenantId = UUID.randomUUID();
    private final String verificationCode = "ABCD-1234-EFGH";

    @BeforeEach
    void setUp() {
        CertificateType type = CertificateType.builder()
                .name("Employment Certificate")
                .build();

        CertificateRequest request = CertificateRequest.builder()
                .certificateType(type)
                .employeeName("John Doe")
                .build();

        certificateIssue = CertificateIssue.builder()
                .request(request)
                .issueNumber("CERT-20231010-000001")
                .verificationCode(verificationCode)
                .expiresAt(LocalDate.now().plusDays(30))
                .build();

        // Set tenantId manually as PrePersist doesn't run in mocks
        ReflectionTestUtils.setField(certificateIssue, "tenantId", tenantId);
    }

    @Test
    void verify_shouldReturnTenantName_whenClientCallSucceeds() {
        // Given
        VerifyCertificateRequest request = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        when(certificateIssueRepository.findByVerificationCode(verificationCode))
                .thenReturn(Optional.of(certificateIssue));

        TenantClientResponse tenantResponse = TenantClientResponse.builder()
                .id(tenantId)
                .name("Acme Corp")
                .build();
        when(tenantServiceClient.getBasicInfo(tenantId))
                .thenReturn(ApiResponse.success(tenantResponse));

        // When
        VerificationResultResponse result = verificationService.verify(request, "127.0.0.1", "Mozilla");

        // Then
        assertThat(result.isValid()).isTrue();
        assertThat(result.getIssuingOrganization()).isEqualTo("Acme Corp");
        verify(tenantServiceClient).getBasicInfo(tenantId);
    }

    @Test
    void verify_shouldReturnFallbackName_whenClientCallFails() {
        // Given
        VerifyCertificateRequest request = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        when(certificateIssueRepository.findByVerificationCode(verificationCode))
                .thenReturn(Optional.of(certificateIssue));

        when(tenantServiceClient.getBasicInfo(tenantId))
                .thenThrow(new RuntimeException("Service down"));

        // When
        VerificationResultResponse result = verificationService.verify(request, "127.0.0.1", "Mozilla");

        // Then
        assertThat(result.isValid()).isTrue();
        assertThat(result.getIssuingOrganization()).isEqualTo("회사명"); // Fallback
        verify(tenantServiceClient).getBasicInfo(tenantId);
    }

    @Test
    void verify_shouldReturnFallbackName_whenClientReturnsNull() {
        // Given
        VerifyCertificateRequest request = VerifyCertificateRequest.builder()
                .verificationCode(verificationCode)
                .build();

        when(certificateIssueRepository.findByVerificationCode(verificationCode))
                .thenReturn(Optional.of(certificateIssue));

        when(tenantServiceClient.getBasicInfo(tenantId))
                .thenReturn(null);

        // When
        VerificationResultResponse result = verificationService.verify(request, "127.0.0.1", "Mozilla");

        // Then
        assertThat(result.isValid()).isTrue();
        assertThat(result.getIssuingOrganization()).isEqualTo("회사명"); // Fallback
    }
}
