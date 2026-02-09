package com.hrsaas.employee.service;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.ApprovalServiceClient;
import com.hrsaas.employee.client.dto.CreateApprovalClientRequest;
import com.hrsaas.employee.client.dto.ApprovalDocumentClientResponse;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.employee.domain.dto.request.CreateCondolenceRequest;
import com.hrsaas.employee.domain.entity.CondolenceEventType;
import com.hrsaas.employee.domain.entity.CondolencePolicy;
import com.hrsaas.employee.domain.entity.CondolenceRequest;
import com.hrsaas.employee.domain.entity.CondolenceStatus;
import com.hrsaas.employee.repository.CondolencePolicyRepository;
import com.hrsaas.employee.repository.CondolenceRequestRepository;
import com.hrsaas.employee.service.impl.CondolenceServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CondolenceServiceImplTest {

    @Mock
    private CondolenceRequestRepository condolenceRequestRepository;

    @Mock
    private CondolencePolicyRepository condolencePolicyRepository;

    @Mock
    private ApprovalServiceClient approvalServiceClient;

    @InjectMocks
    private CondolenceServiceImpl condolenceService;

    private UUID tenantId;
    private UUID requestId;
    private UUID policyId;
    private CondolenceRequest condolenceRequest;
    private CondolencePolicy condolencePolicy;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        requestId = UUID.randomUUID();
        policyId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        condolencePolicy = CondolencePolicy.builder()
            .eventType(CondolenceEventType.DEATH_PARENT)
            .name("부모 사망")
            .description("부모 사망 시 경조비")
            .amount(new BigDecimal("500000"))
            .leaveDays(5)
            .sortOrder(1)
            .build();
        setEntityId(condolencePolicy, policyId);

        condolenceRequest = CondolenceRequest.builder()
            .employeeId(UUID.randomUUID())
            .employeeName("홍길동")
            .departmentName("개발팀")
            .policyId(policyId)
            .eventType(CondolenceEventType.DEATH_PARENT)
            .eventDate(LocalDate.now())
            .description("부친상")
            .relation("부")
            .relatedPersonName("홍부")
            .amount(new BigDecimal("500000"))
            .leaveDays(5)
            .build();
        setEntityId(condolenceRequest, requestId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createRequest_callsApprovalService() {
        CreateCondolenceRequest request = CreateCondolenceRequest.builder()
            .eventType(CondolenceEventType.DEATH_PARENT)
            .relatedPersonName("홍부")
            .relation("부")
            .eventDate(LocalDate.now())
            .description("부친상")
            .policyId(policyId)
            .build();

        when(condolencePolicyRepository.findByIdAndTenantId(policyId, tenantId))
            .thenReturn(Optional.of(condolencePolicy));
        when(condolenceRequestRepository.save(any(CondolenceRequest.class)))
            .thenReturn(condolenceRequest);

        ApprovalDocumentClientResponse approvalResponse = ApprovalDocumentClientResponse.builder()
            .approvalId(UUID.randomUUID())
            .build();
        when(approvalServiceClient.createApproval(any(CreateApprovalClientRequest.class)))
            .thenReturn(ApiResponse.success(approvalResponse));

        condolenceService.createRequest(request);

        verify(approvalServiceClient).createApproval(any(CreateApprovalClientRequest.class));
    }

    @Test
    void createRequest_approvalDown_stillSavesRequest() {
        CreateCondolenceRequest request = CreateCondolenceRequest.builder()
            .eventType(CondolenceEventType.DEATH_PARENT)
            .relatedPersonName("홍부")
            .relation("부")
            .eventDate(LocalDate.now())
            .description("부친상")
            .policyId(policyId)
            .build();

        when(condolencePolicyRepository.findByIdAndTenantId(policyId, tenantId))
            .thenReturn(Optional.of(condolencePolicy));
        when(condolenceRequestRepository.save(any(CondolenceRequest.class)))
            .thenReturn(condolenceRequest);
        when(approvalServiceClient.createApproval(any(CreateApprovalClientRequest.class)))
            .thenThrow(new RuntimeException("Approval service down"));

        // Should not throw exception even if approval service fails
        condolenceService.createRequest(request);

        verify(condolenceRequestRepository, times(1)).save(any(CondolenceRequest.class));
    }

    @Test
    void approveByApproval_updatesStatusApproved() {
        condolenceRequest.setStatus(CondolenceStatus.PENDING);

        when(condolenceRequestRepository.findById(requestId))
            .thenReturn(Optional.of(condolenceRequest));
        when(condolenceRequestRepository.save(any(CondolenceRequest.class)))
            .thenReturn(condolenceRequest);

        condolenceService.approveByApproval(requestId);

        assertThat(condolenceRequest.getStatus()).isEqualTo(CondolenceStatus.APPROVED);
        verify(condolenceRequestRepository).save(condolenceRequest);
    }

    @Test
    void rejectByApproval_updatesStatusRejected() {
        String rejectReason = "부적절한 신청";
        condolenceRequest.setStatus(CondolenceStatus.PENDING);

        when(condolenceRequestRepository.findById(requestId))
            .thenReturn(Optional.of(condolenceRequest));
        when(condolenceRequestRepository.save(any(CondolenceRequest.class)))
            .thenReturn(condolenceRequest);

        condolenceService.rejectByApproval(requestId, rejectReason);

        assertThat(condolenceRequest.getStatus()).isEqualTo(CondolenceStatus.REJECTED);
        assertThat(condolenceRequest.getRejectReason()).isEqualTo(rejectReason);
        verify(condolenceRequestRepository).save(condolenceRequest);
    }

    @Test
    void createRequest_withPolicy_setsAmountAndLeaveDays() {
        CreateCondolenceRequest request = CreateCondolenceRequest.builder()
            .eventType(CondolenceEventType.DEATH_PARENT)
            .relatedPersonName("홍부")
            .relation("부")
            .eventDate(LocalDate.now())
            .description("부친상")
            .build();

        when(condolencePolicyRepository.findByTenantIdAndEventType(tenantId, CondolenceEventType.DEATH_PARENT))
            .thenReturn(Optional.of(condolencePolicy));
        when(condolenceRequestRepository.save(any(CondolenceRequest.class)))
            .thenAnswer(invocation -> {
                CondolenceRequest saved = invocation.getArgument(0);
                setEntityId(saved, requestId);
                return saved;
            });

        condolenceService.createRequest(request);

        verify(condolenceRequestRepository).save(argThat(req ->
            req.getAmount().equals(new BigDecimal("500000")) &&
            req.getLeaveDays().equals(5)
        ));
    }

    // Helper methods

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + fieldName);
    }
}
