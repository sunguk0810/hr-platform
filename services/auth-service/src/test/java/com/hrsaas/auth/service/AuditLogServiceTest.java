package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.entity.AuditLog;
import com.hrsaas.auth.repository.AuditLogRepository;
import com.hrsaas.auth.service.impl.AuditLogServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    private final UUID tenantId = UUID.randomUUID();

    @Test
    @DisplayName("log - success - saves audit log with SUCCESS status")
    void log_success_savesWithSuccessStatus() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        auditLogService.log(tenantId, "user-123", "홍길동", "LOGIN",
                "SESSION", "session-1", "로그인 성공",
                "192.168.1.1", "Mozilla/5.0");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getActorId()).isEqualTo("user-123");
        assertThat(saved.getAction()).isEqualTo("LOGIN");
        assertThat(saved.getStatus()).isEqualTo("SUCCESS");
        assertThat(saved.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("logFailure - saves audit log with FAILURE status and error message")
    void logFailure_savesWithFailureStatus() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        auditLogService.logFailure(tenantId, "user-456", "김실패", "LOGIN",
                "SESSION", "session-2", "로그인 실패",
                "10.0.0.1", "Chrome", "Invalid password");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo("FAILURE");
        assertThat(saved.getErrorMessage()).isEqualTo("Invalid password");
    }

    @Test
    @DisplayName("log - repository throws exception - does not propagate")
    void log_repositoryFails_doesNotPropagate() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB error"));

        // Should not throw
        auditLogService.log(tenantId, "user-789", "박에러", "LOGIN",
                "SESSION", "session-3", "description",
                "10.0.0.2", "Safari");

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("getAuditLogs - returns paged results")
    void getAuditLogs_returnsPagedResults() {
        AuditLog log = AuditLog.builder()
                .tenantId(tenantId).actorId("user-1").action("LOGIN").status("SUCCESS").build();
        Page<AuditLog> page = new PageImpl<>(List.of(log));
        Pageable pageable = PageRequest.of(0, 20);

        when(auditLogRepository.findByTenantId(tenantId, pageable)).thenReturn(page);

        Page<AuditLog> result = auditLogService.getAuditLogs(tenantId, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("LOGIN");
    }

    @Test
    @DisplayName("getAuditLogsByActor - filters by actorId")
    void getAuditLogsByActor_filtersByActor() {
        Pageable pageable = PageRequest.of(0, 20);
        when(auditLogRepository.findByTenantIdAndActorId(tenantId, "user-1", pageable))
                .thenReturn(Page.empty());

        Page<AuditLog> result = auditLogService.getAuditLogsByActor(tenantId, "user-1", pageable);

        assertThat(result.isEmpty()).isTrue();
        verify(auditLogRepository).findByTenantIdAndActorId(tenantId, "user-1", pageable);
    }

    @Test
    @DisplayName("getAuditLogsByAction - filters by action")
    void getAuditLogsByAction_filtersByAction() {
        Pageable pageable = PageRequest.of(0, 20);
        when(auditLogRepository.findByTenantIdAndAction(tenantId, "LOGIN", pageable))
                .thenReturn(Page.empty());

        Page<AuditLog> result = auditLogService.getAuditLogsByAction(tenantId, "LOGIN", pageable);

        assertThat(result.isEmpty()).isTrue();
        verify(auditLogRepository).findByTenantIdAndAction(tenantId, "LOGIN", pageable);
    }
}
