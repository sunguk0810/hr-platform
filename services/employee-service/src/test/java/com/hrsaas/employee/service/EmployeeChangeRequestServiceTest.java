package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.client.ApprovalServiceClient;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeChangeRequest;
import com.hrsaas.employee.repository.EmployeeChangeRequestRepository;
import com.hrsaas.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link EmployeeChangeRequestService}.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeChangeRequestService Tests")
class EmployeeChangeRequestServiceTest {

    @Mock
    private EmployeeChangeRequestRepository changeRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private ApprovalServiceClient approvalServiceClient;

    @InjectMocks
    private EmployeeChangeRequestService changeRequestService;

    @Captor
    private ArgumentCaptor<EmployeeChangeRequest> requestCaptor;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();
    private static final UUID CHANGE_REQUEST_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("create: valid request saves with PENDING status")
    void create_validRequest_savesWithPendingStatus() {
        // given
        EmployeeChangeRequest request = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("mobile")
            .oldValue("010-1234-5678")
            .newValue("010-9999-8888")
            .reason("Changed phone number")
            .build();
        // Builder.Default sets status to "PENDING"

        EmployeeChangeRequest savedRequest = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("mobile")
            .oldValue("010-1234-5678")
            .newValue("010-9999-8888")
            .status("PENDING")
            .reason("Changed phone number")
            .build();

        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenReturn(savedRequest);

        // when
        EmployeeChangeRequest result = changeRequestService.create(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getFieldName()).isEqualTo("mobile");
        assertThat(result.getOldValue()).isEqualTo("010-1234-5678");
        assertThat(result.getNewValue()).isEqualTo("010-9999-8888");

        verify(changeRequestRepository).save(request);
    }

    @Test
    @DisplayName("create: request defaults to PENDING status via @Builder.Default")
    void create_newRequest_defaultsPendingStatus() {
        // given
        EmployeeChangeRequest request = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("email")
            .oldValue("old@example.com")
            .newValue("new@example.com")
            .build();

        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        EmployeeChangeRequest result = changeRequestService.create(request);

        // then
        verify(changeRequestRepository).save(requestCaptor.capture());
        EmployeeChangeRequest capturedRequest = requestCaptor.getValue();
        assertThat(capturedRequest.getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("handleApprovalCompleted: approved sets APPROVED status")
    void handleApprovalCompleted_approved_updatesEmployeeField() {
        // given
        EmployeeChangeRequest pendingRequest = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("mobile")
            .oldValue("010-1234-5678")
            .newValue("010-9999-8888")
            .status("PENDING")
            .reason("Changed phone number")
            .build();

        Employee employee = Employee.builder()
            .name("홍길동")
            .mobile("010-1234-5678")
            .build();

        when(changeRequestRepository.findById(CHANGE_REQUEST_ID))
            .thenReturn(Optional.of(pendingRequest));
        when(employeeRepository.findById(EMPLOYEE_ID))
            .thenReturn(Optional.of(employee));
        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenReturn(pendingRequest);

        // when
        changeRequestService.handleApprovalCompleted(CHANGE_REQUEST_ID, true, null, null);

        // then
        assertThat(pendingRequest.getStatus()).isEqualTo("APPROVED");
        assertThat(employee.getMobile()).isEqualTo("010-9999-8888");

        verify(changeRequestRepository).findById(CHANGE_REQUEST_ID);
        verify(employeeRepository).findById(EMPLOYEE_ID);
        verify(changeRequestRepository).save(pendingRequest);
    }

    @Test
    @DisplayName("handleApprovalCompleted: rejected sets REJECTED status")
    void handleApprovalCompleted_rejected_setsRejectedStatus() {
        // given
        EmployeeChangeRequest pendingRequest = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("email")
            .oldValue("old@example.com")
            .newValue("new@example.com")
            .status("PENDING")
            .reason("Want to change email")
            .build();

        when(changeRequestRepository.findById(CHANGE_REQUEST_ID))
            .thenReturn(Optional.of(pendingRequest));
        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenReturn(pendingRequest);

        // when
        changeRequestService.handleApprovalCompleted(CHANGE_REQUEST_ID, false, null, "Rejected");

        // then
        assertThat(pendingRequest.getStatus()).isEqualTo("REJECTED");

        verify(changeRequestRepository).findById(CHANGE_REQUEST_ID);
        verify(changeRequestRepository).save(pendingRequest);
    }

    @Test
    @DisplayName("handleApprovalCompleted: non-existing request throws IllegalArgumentException")
    void handleApprovalCompleted_notFound_throwsException() {
        // given
        UUID nonExistentId = UUID.randomUUID();
        when(changeRequestRepository.findById(nonExistentId))
            .thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> changeRequestService.handleApprovalCompleted(nonExistentId, true, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Change request not found");

        verify(changeRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("getByEmployeeId: returns change requests for the employee")
    void getByEmployeeId_existingEmployee_returnsRequests() {
        // given
        EmployeeChangeRequest request1 = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("mobile")
            .oldValue("010-0000-0000")
            .newValue("010-1111-1111")
            .status("APPROVED")
            .build();

        EmployeeChangeRequest request2 = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("email")
            .oldValue("a@example.com")
            .newValue("b@example.com")
            .status("PENDING")
            .build();

        when(changeRequestRepository.findByEmployeeId(TENANT_ID, EMPLOYEE_ID))
            .thenReturn(java.util.List.of(request1, request2));

        // when
        java.util.List<EmployeeChangeRequest> result = changeRequestService.getByEmployeeId(EMPLOYEE_ID);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getFieldName()).isEqualTo("mobile");
        assertThat(result.get(1).getFieldName()).isEqualTo("email");

        verify(changeRequestRepository).findByEmployeeId(TENANT_ID, EMPLOYEE_ID);
    }

    @Test
    @DisplayName("handleApprovalCompleted: approved request calls approve() which sets status to APPROVED")
    void handleApprovalCompleted_approved_callsApproveMethod() {
        // given
        EmployeeChangeRequest pendingRequest = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("phone")
            .oldValue("02-123-4567")
            .newValue("02-987-6543")
            .status("PENDING")
            .build();

        Employee employee = Employee.builder()
            .name("홍길동")
            .phone("02-123-4567")
            .build();

        when(changeRequestRepository.findById(CHANGE_REQUEST_ID))
            .thenReturn(Optional.of(pendingRequest));
        when(employeeRepository.findById(EMPLOYEE_ID))
            .thenReturn(Optional.of(employee));
        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        changeRequestService.handleApprovalCompleted(CHANGE_REQUEST_ID, true, null, null);

        // then
        verify(changeRequestRepository).save(requestCaptor.capture());
        EmployeeChangeRequest savedRequest = requestCaptor.getValue();
        assertThat(savedRequest.getStatus()).isEqualTo("APPROVED");
        assertThat(savedRequest.getFieldName()).isEqualTo("phone");
        assertThat(employee.getPhone()).isEqualTo("02-987-6543");
    }

    @Test
    @DisplayName("handleApprovalCompleted: rejected request calls reject() which sets status to REJECTED")
    void handleApprovalCompleted_rejected_callsRejectMethod() {
        // given
        EmployeeChangeRequest pendingRequest = EmployeeChangeRequest.builder()
            .employeeId(EMPLOYEE_ID)
            .fieldName("address")
            .oldValue("Seoul")
            .newValue("Busan")
            .status("PENDING")
            .build();

        when(changeRequestRepository.findById(CHANGE_REQUEST_ID))
            .thenReturn(Optional.of(pendingRequest));
        when(changeRequestRepository.save(any(EmployeeChangeRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        changeRequestService.handleApprovalCompleted(CHANGE_REQUEST_ID, false, null, "Rejected");

        // then
        verify(changeRequestRepository).save(requestCaptor.capture());
        EmployeeChangeRequest savedRequest = requestCaptor.getValue();
        assertThat(savedRequest.getStatus()).isEqualTo("REJECTED");
    }
}
