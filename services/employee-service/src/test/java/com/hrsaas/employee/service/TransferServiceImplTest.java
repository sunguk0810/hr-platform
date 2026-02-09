package com.hrsaas.employee.service;

import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.OrganizationServiceClient;
import com.hrsaas.employee.client.TenantServiceClient;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.domain.entity.TransferRequest;
import com.hrsaas.employee.domain.entity.TransferStatus;
import com.hrsaas.employee.domain.event.TransferCompletedEvent;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.repository.TransferRequestRepository;
import com.hrsaas.employee.service.impl.TransferServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceImplTest {

    @Mock
    private TransferRequestRepository transferRequestRepository;

    @Mock
    private TenantServiceClient tenantServiceClient;

    @Mock
    private OrganizationServiceClient organizationServiceClient;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeNumberGenerator employeeNumberGenerator;

    @Mock
    private EmployeeHistoryRecorder historyRecorder;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private TransferServiceImpl transferService;

    private UUID tenantId;
    private UUID sourceTenantId;
    private UUID targetTenantId;
    private UUID transferId;
    private UUID sourceEmployeeId;
    private UUID targetDeptId;
    private TransferRequest transferRequest;
    private Employee sourceEmployee;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        sourceTenantId = UUID.randomUUID();
        targetTenantId = UUID.randomUUID();
        transferId = UUID.randomUUID();
        sourceEmployeeId = UUID.randomUUID();
        targetDeptId = UUID.randomUUID();

        TenantContext.setCurrentTenant(tenantId);

        sourceEmployee = Employee.builder()
            .employeeNumber("EMP-2026-0001")
            .name("홍길동")
            .nameEn("Hong Gildong")
            .email("hong@example.com")
            .phone("02-1234-5678")
            .mobile("010-1234-5678")
            .hireDate(LocalDate.of(2026, 1, 1))
            .build();
        setEntityId(sourceEmployee, sourceEmployeeId);

        transferRequest = TransferRequest.builder()
            .employeeId(sourceEmployeeId)
            .employeeName("홍길동")
            .employeeNumber("EMP-2026-0001")
            .sourceTenantId(sourceTenantId)
            .sourceTenantName("원 소속")
            .targetTenantId(targetTenantId)
            .targetTenantName("대상 소속")
            .targetDepartmentId(targetDeptId)
            .transferDate(LocalDate.now())
            .reason("계열사 이동")
            .build();
        transferRequest.setStatus(TransferStatus.APPROVED);
        setEntityId(transferRequest, transferId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void complete_createsEmployeeInTargetTenant() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                setEntityId(saved, UUID.randomUUID());
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        verify(employeeRepository, times(2)).save(any(Employee.class));
    }

    @Test
    void complete_resignsSourceEmployee() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                if (saved.getId() == null) {
                    setEntityId(saved, UUID.randomUUID());
                }
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        assertThat(sourceEmployee.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        assertThat(sourceEmployee.getResignDate()).isEqualTo(transferRequest.getTransferDate());
    }

    @Test
    void complete_generatesNewEmployeeNumber() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                if (saved.getId() == null) {
                    setEntityId(saved, UUID.randomUUID());
                }
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        verify(employeeNumberGenerator).generate(transferRequest.getTransferDate());
    }

    @Test
    void complete_recordsHistoryBothTenants() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                if (saved.getId() == null) {
                    setEntityId(saved, UUID.randomUUID());
                }
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        verify(historyRecorder, times(1)).recordHire(any(Employee.class), anyString());
        verify(historyRecorder, times(1)).recordResign(any(Employee.class), anyString());
    }

    @Test
    void complete_publishesTransferCompletedEvent() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                if (saved.getId() == null) {
                    setEntityId(saved, UUID.randomUUID());
                }
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        verify(eventPublisher).publish(any(TransferCompletedEvent.class));
    }

    @Test
    void complete_notApproved_throwsValidation() {
        transferRequest.setStatus(TransferStatus.PENDING);

        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));

        assertThatThrownBy(() -> transferService.complete(transferId))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("승인 상태의 요청만 완료 처리할 수 있습니다");
    }

    @Test
    void complete_setsTransferStatusCompleted() {
        when(transferRequestRepository.findByIdAndTenantId(transferId, tenantId))
            .thenReturn(Optional.of(transferRequest));
        when(employeeRepository.findById(sourceEmployeeId))
            .thenReturn(Optional.of(sourceEmployee));
        when(employeeNumberGenerator.generate(any(LocalDate.class)))
            .thenReturn("EMP-NEW-001");
        when(employeeRepository.save(any(Employee.class)))
            .thenAnswer(invocation -> {
                Employee saved = invocation.getArgument(0);
                if (saved.getId() == null) {
                    setEntityId(saved, UUID.randomUUID());
                }
                return saved;
            });
        when(transferRequestRepository.save(any(TransferRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        transferService.complete(transferId);

        assertThat(transferRequest.getStatus()).isEqualTo(TransferStatus.COMPLETED);
        assertThat(transferRequest.getCompletedAt()).isNotNull();
        verify(transferRequestRepository).save(transferRequest);
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
