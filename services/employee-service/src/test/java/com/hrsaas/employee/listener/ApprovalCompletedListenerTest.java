package com.hrsaas.employee.listener;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.request.UpdateEmployeeRequest;
import com.hrsaas.employee.service.CondolenceService;
import com.hrsaas.employee.service.EmployeeChangeRequestService;
import com.hrsaas.employee.service.EmployeeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalCompletedListenerTest {

    @Mock
    private CondolenceService condolenceService;

    @Mock
    private EmployeeChangeRequestService changeRequestService;

    @Mock
    private EmployeeService employeeService;

    @InjectMocks
    private ApprovalCompletedListener listener;

    private UUID tenantId;
    private UUID referenceId;
    private UUID employeeId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        referenceId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void handleCondolenceApproved_callsApprove() {
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "CONDOLENCE",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, referenceId);

        listener.handleMessage(message);

        verify(condolenceService).approveByApproval(referenceId);
        verify(condolenceService, never()).rejectByApproval(any(UUID.class), anyString());
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean(), any(), any());
    }

    @Test
    void handleCondolenceRejected_callsReject() {
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "CONDOLENCE",
              "referenceId": "%s",
              "status": "REJECTED",
              "reason": "부적절한 신청"
            }
            """, referenceId);

        listener.handleMessage(message);

        verify(condolenceService).rejectByApproval(referenceId, "부적절한 신청");
        verify(condolenceService, never()).approveByApproval(any(UUID.class));
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean(), any(), any());
    }

    @Test
    void handleChangeApproved_callsHandleApproval() {
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "EMPLOYEE_CHANGE",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, referenceId);

        listener.handleMessage(message);

        verify(changeRequestService).handleApprovalCompleted(eq(referenceId), eq(true), isNull(), isNull());
        verify(condolenceService, never()).approveByApproval(any(UUID.class));
        verify(condolenceService, never()).rejectByApproval(any(UUID.class), anyString());
    }

    @Test
    void handleChangeRejected_callsHandleApproval() {
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "EMPLOYEE_CHANGE",
              "referenceId": "%s",
              "status": "REJECTED"
            }
            """, referenceId);

        listener.handleMessage(message);

        verify(changeRequestService).handleApprovalCompleted(eq(referenceId), eq(false), isNull(), isNull());
        verify(condolenceService, never()).approveByApproval(any(UUID.class));
        verify(condolenceService, never()).rejectByApproval(any(UUID.class), anyString());
    }

    @Test
    void handleUnknownDocType_ignoresEvent() {
        String message = String.format("""
            {
              "eventType": "ApprovalCompletedEvent",
              "documentType": "UNKNOWN_TYPE",
              "referenceId": "%s",
              "status": "APPROVED"
            }
            """, referenceId);

        listener.handleMessage(message);

        verify(condolenceService, never()).approveByApproval(any(UUID.class));
        verify(condolenceService, never()).rejectByApproval(any(UUID.class), anyString());
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean(), any(), any());
    }

    @Test
    void handleAppointmentExecuted_updatesEmployee() {
        String effectiveDate = LocalDate.now().toString();
        String message = String.format("""
            {
              "eventType": "AppointmentExecutedEvent",
              "effectiveDate": "%s",
              "details": [
                {
                  "employeeId": "%s",
                  "appointmentType": "TRANSFER",
                  "toDepartmentId": "%s",
                  "toPositionCode": "POS_001",
                  "toGradeCode": "GRD_001"
                }
              ]
            }
            """, effectiveDate, employeeId, UUID.randomUUID());

        listener.handleMessage(message);

        ArgumentCaptor<List<UpdateEmployeeRequest>> requestCaptor = ArgumentCaptor.forClass(List.class);
        verify(employeeService).bulkUpdate(requestCaptor.capture());

        List<UpdateEmployeeRequest> requests = requestCaptor.getValue();
        assertThat(requests).hasSize(1);
        UpdateEmployeeRequest request = requests.get(0);
        assertThat(request.getEmployeeId()).isEqualTo(employeeId);
        assertThat(request.getDepartmentId()).isNotNull();
        assertThat(request.getPositionCode()).isEqualTo("POS_001");
        assertThat(request.getJobTitleCode()).isEqualTo("GRD_001");
    }

    @Test
    void handleAppointmentExecuted_resignation() {
        String effectiveDate = LocalDate.now().toString();
        String message = String.format("""
            {
              "eventType": "AppointmentExecutedEvent",
              "effectiveDate": "%s",
              "details": [
                {
                  "employeeId": "%s",
                  "appointmentType": "RESIGNATION"
                }
              ]
            }
            """, effectiveDate, employeeId);

        listener.handleMessage(message);

        ArgumentCaptor<List<UUID>> idCaptor = ArgumentCaptor.forClass(List.class);
        verify(employeeService).bulkResign(idCaptor.capture(), eq(effectiveDate));
        assertThat(idCaptor.getValue()).containsExactly(employeeId);
    }

    @Test
    void handleAppointmentExecuted_leaveOfAbsence() {
        String effectiveDate = LocalDate.now().toString();
        String message = String.format("""
            {
              "eventType": "AppointmentExecutedEvent",
              "effectiveDate": "%s",
              "details": [
                {
                  "employeeId": "%s",
                  "appointmentType": "LEAVE_OF_ABSENCE"
                }
              ]
            }
            """, effectiveDate, employeeId);

        listener.handleMessage(message);

        ArgumentCaptor<List<UUID>> idCaptor = ArgumentCaptor.forClass(List.class);
        verify(employeeService).bulkSuspend(idCaptor.capture());
        assertThat(idCaptor.getValue()).containsExactly(employeeId);
    }

    @Test
    void handleAppointmentExecuted_reinstatement() {
        String effectiveDate = LocalDate.now().toString();
        String message = String.format("""
            {
              "eventType": "AppointmentExecutedEvent",
              "effectiveDate": "%s",
              "details": [
                {
                  "employeeId": "%s",
                  "appointmentType": "REINSTATEMENT"
                }
              ]
            }
            """, effectiveDate, employeeId);

        listener.handleMessage(message);

        ArgumentCaptor<List<UUID>> idCaptor = ArgumentCaptor.forClass(List.class);
        verify(employeeService).bulkActivate(idCaptor.capture());
        assertThat(idCaptor.getValue()).containsExactly(employeeId);
    }

    @Test
    void handleAppointmentExecuted_multipleDetails() {
        UUID employeeId2 = UUID.randomUUID();
        String effectiveDate = LocalDate.now().toString();
        String message = String.format("""
            {
              "eventType": "AppointmentExecutedEvent",
              "effectiveDate": "%s",
              "details": [
                {
                  "employeeId": "%s",
                  "appointmentType": "TRANSFER",
                  "toDepartmentId": "%s"
                },
                {
                  "employeeId": "%s",
                  "appointmentType": "RESIGNATION"
                }
              ]
            }
            """, effectiveDate, employeeId, UUID.randomUUID(), employeeId2);

        listener.handleMessage(message);

        verify(employeeService).bulkUpdate(anyList());
        verify(employeeService).bulkResign(anyList(), eq(effectiveDate));
    }
}
