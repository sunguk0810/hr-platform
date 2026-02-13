package com.hrsaas.certificate.service.impl;

import com.hrsaas.certificate.domain.dto.request.CreateCertificateRequestRequest;
import com.hrsaas.certificate.domain.entity.CertificateRequest;
import com.hrsaas.certificate.domain.entity.CertificateType;
import com.hrsaas.certificate.domain.entity.RequestStatus;
import com.hrsaas.certificate.repository.CertificateRequestRepository;
import com.hrsaas.certificate.repository.CertificateTypeRepository;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class CertificateRequestServiceImplTest {

    @Mock
    private CertificateRequestRepository certificateRequestRepository;

    @Mock
    private CertificateTypeRepository certificateTypeRepository;

    @InjectMocks
    private CertificateRequestServiceImpl certificateRequestService;

    private UUID employeeId;
    private UUID typeId;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        typeId = UUID.randomUUID();

        SecurityContextHolder.setContext(UserContext.builder()
                .employeeId(employeeId)
                .userId(UUID.randomUUID())
                .roles(Set.of("EMPLOYEE"))
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("create should inject employeeId from current security context")
    void create_shouldUseEmployeeIdFromContext() {
        CreateCertificateRequestRequest request = CreateCertificateRequestRequest.builder()
                .certificateTypeId(typeId)
                .copies(1)
                .build();

        CertificateType certificateType = CertificateType.builder()
                .code("EMPLOYMENT")
                .name("재직증명")
                .validDays(30)
                .fee(BigDecimal.ZERO)
                .maxCopiesPerRequest(5)
                .build();

        given(certificateTypeRepository.findById(typeId)).willReturn(Optional.of(certificateType));
        given(certificateRequestRepository.save(any(CertificateRequest.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        certificateRequestService.create(request);

        then(certificateRequestRepository).should().save(argThat(req -> employeeId.equals(req.getEmployeeId())));
        assertThat(SecurityContextHolder.getCurrentEmployeeId()).isEqualTo(employeeId);
    }

    @Test
    @DisplayName("create should fail when employee context is missing")
    void create_shouldFailWithoutEmployeeContext() {
        SecurityContextHolder.clear();

        CreateCertificateRequestRequest request = CreateCertificateRequestRequest.builder()
                .certificateTypeId(typeId)
                .copies(1)
                .build();

        assertThatThrownBy(() -> certificateRequestService.create(request))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("getMyRequests should fail when context employeeId is missing")
    void getMyRequests_shouldFailWithoutEmployeeContext() {
        SecurityContextHolder.setContext(UserContext.builder().build());

        assertThatThrownBy(() -> certificateRequestService.getMyRequests(null, Pageable.unpaged()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("getMyRequests should query repository with context employeeId")
    void getMyRequests_shouldDelegateToRepository() {
        Pageable pageable = Pageable.unpaged();
        given(certificateRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId, pageable))
                .willReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        Page<?> result = certificateRequestService.getMyRequests(employeeId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }

    @Test
    @DisplayName("getMyRequests should query repository with status and typeCode filters")
    void getMyRequests_withFilters_shouldDelegateToRepository() {
        Pageable pageable = Pageable.unpaged();
        String typeCode = "EMPLOYMENT";

        given(certificateRequestRepository
                .findByEmployeeIdAndCertificateTypeCodeAndStatusOrderByCreatedAtDesc(
                        eq(employeeId),
                        eq(typeCode),
                        eq(RequestStatus.APPROVED),
                        eq(pageable)))
                .willReturn(new PageImpl<>(java.util.List.of(), pageable, 0));

        Page<?> result = certificateRequestService.getMyRequests(
                employeeId,
                RequestStatus.APPROVED,
                typeCode,
                pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(0);
    }
}
