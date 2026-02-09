package com.hrsaas.attendance.listener;

import com.hrsaas.attendance.service.LeaveAccrualService;
import com.hrsaas.attendance.service.LeaveService;
import com.hrsaas.attendance.service.OvertimeService;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalCompletedListener Tests")
class ApprovalCompletedListenerTest {

    @Mock
    private LeaveService leaveService;

    @Mock
    private OvertimeService overtimeService;

    @Mock
    private LeaveAccrualService accrualService;

    @InjectMocks
    private ApprovalCompletedListener listener;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("handleMessage: OVERTIME_REQUEST APPROVED delegates to approve")
    void handleMessage_overtimeApproved_delegatesToApprove() {
        // given
        UUID referenceId = UUID.randomUUID();
        String message = String.format("""
            {
                "eventType": "ApprovalCompletedEvent",
                "documentType": "OVERTIME_REQUEST",
                "referenceId": "%s",
                "status": "APPROVED"
            }
            """, referenceId);

        // when
        listener.handleMessage(message);

        // then
        verify(overtimeService).approve(referenceId);
        verify(overtimeService, never()).reject(any(), any());
    }

    @Test
    @DisplayName("handleMessage: OVERTIME_REQUEST REJECTED delegates to reject")
    void handleMessage_overtimeRejected_delegatesToReject() {
        // given
        UUID referenceId = UUID.randomUUID();
        String message = String.format("""
            {
                "eventType": "ApprovalCompletedEvent",
                "documentType": "OVERTIME_REQUEST",
                "referenceId": "%s",
                "status": "REJECTED",
                "reason": "업무 필요성 부족"
            }
            """, referenceId);

        // when
        listener.handleMessage(message);

        // then
        verify(overtimeService).reject(referenceId, "업무 필요성 부족");
        verify(overtimeService, never()).approve(any());
    }

    @Test
    @DisplayName("handleMessage: LEAVE_REQUEST delegates to leaveService")
    void handleMessage_leaveApproval_delegatesToLeaveService() {
        // given
        UUID referenceId = UUID.randomUUID();
        String message = String.format("""
            {
                "eventType": "ApprovalCompletedEvent",
                "documentType": "LEAVE_REQUEST",
                "referenceId": "%s",
                "status": "APPROVED"
            }
            """, referenceId);

        // when
        listener.handleMessage(message);

        // then
        verify(leaveService).handleApprovalCompleted(referenceId, true);
        verify(overtimeService, never()).approve(any());
    }

    @Test
    @DisplayName("handleMessage: EmployeeCreatedEvent initializes leave balance")
    void handleMessage_employeeCreated_initializesLeaveBalance() {
        // given
        UUID tenantId = UUID.randomUUID();
        UUID employeeId = UUID.randomUUID();
        String message = String.format("""
            {
                "eventType": "EmployeeCreatedEvent",
                "tenantId": "%s",
                "employeeId": "%s",
                "hireDate": "2026-02-01"
            }
            """, tenantId, employeeId);

        // when
        listener.handleMessage(message);

        // then
        verify(accrualService).generateForEmployee(eq(employeeId), any(), anyInt());
    }

    @Test
    @DisplayName("handleMessage: unknown event type is ignored")
    void handleMessage_unknownEventType_ignored() {
        // given
        String message = """
            {
                "eventType": "SomeUnknownEvent"
            }
            """;

        // when
        listener.handleMessage(message);

        // then
        verify(leaveService, never()).handleApprovalCompleted(any(), anyBoolean());
        verify(overtimeService, never()).approve(any());
        verify(accrualService, never()).generateForEmployee(any(), any(), anyInt());
    }
}
