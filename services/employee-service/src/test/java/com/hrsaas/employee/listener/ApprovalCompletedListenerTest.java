package com.hrsaas.employee.listener;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.service.CondolenceService;
import com.hrsaas.employee.service.EmployeeChangeRequestService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalCompletedListenerTest {

    @Mock
    private CondolenceService condolenceService;

    @Mock
    private EmployeeChangeRequestService changeRequestService;

    @InjectMocks
    private ApprovalCompletedListener listener;

    private UUID tenantId;
    private UUID referenceId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        referenceId = UUID.randomUUID();
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
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean());
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
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean());
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

        verify(changeRequestService).handleApprovalCompleted(referenceId, true);
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

        verify(changeRequestService).handleApprovalCompleted(referenceId, false);
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
        verify(changeRequestService, never()).handleApprovalCompleted(any(UUID.class), anyBoolean());
    }
}
