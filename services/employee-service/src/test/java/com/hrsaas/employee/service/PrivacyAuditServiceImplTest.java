package com.hrsaas.employee.service;

import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.PrivacyAccessLog;
import com.hrsaas.employee.repository.PrivacyAccessLogRepository;
import com.hrsaas.employee.service.impl.PrivacyAuditServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PrivacyAuditServiceImplTest {

    @Mock
    private PrivacyAccessLogRepository privacyAccessLogRepository;

    @InjectMocks
    private PrivacyAuditServiceImpl privacyAuditService;

    private UUID tenantId;
    private UUID employeeId;
    private UUID actorId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        actorId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clear();
    }

    @Test
    void logAccess_savesRecord() {
        UserContext userContext = UserContext.builder()
            .userId(actorId)
            .username("testuser")
            .build();
        SecurityContextHolder.setContext(userContext);

        when(privacyAccessLogRepository.save(any(PrivacyAccessLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        privacyAuditService.logAccess(employeeId, "mobile", "급여 계산 확인");

        ArgumentCaptor<PrivacyAccessLog> captor = ArgumentCaptor.forClass(PrivacyAccessLog.class);
        verify(privacyAccessLogRepository).save(captor.capture());

        PrivacyAccessLog saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getActorId()).isEqualTo(actorId);
        assertThat(saved.getActorName()).isEqualTo("testuser");
        assertThat(saved.getEmployeeId()).isEqualTo(employeeId);
        assertThat(saved.getFieldName()).isEqualTo("mobile");
        assertThat(saved.getReason()).isEqualTo("급여 계산 확인");
    }

    @Test
    void logAccess_noCurrentUser_usesSystemActor() {
        // SecurityContextHolder.getCurrentUser() returns null by default

        when(privacyAccessLogRepository.save(any(PrivacyAccessLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        privacyAuditService.logAccess(employeeId, "residentNumber", "시스템 검증");

        ArgumentCaptor<PrivacyAccessLog> captor = ArgumentCaptor.forClass(PrivacyAccessLog.class);
        verify(privacyAccessLogRepository).save(captor.capture());

        PrivacyAccessLog saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getActorId()).isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000000"));
        assertThat(saved.getActorName()).isEqualTo("SYSTEM");
        assertThat(saved.getEmployeeId()).isEqualTo(employeeId);
        assertThat(saved.getFieldName()).isEqualTo("residentNumber");
        assertThat(saved.getReason()).isEqualTo("시스템 검증");
    }

    @Test
    void getLogsByEmployee_returnsPaginated() {
        Pageable pageable = PageRequest.of(0, 10);
        PrivacyAccessLog log = PrivacyAccessLog.builder()
            .tenantId(tenantId)
            .actorId(actorId)
            .actorName("testuser")
            .employeeId(employeeId)
            .fieldName("mobile")
            .reason("조회")
            .build();
        Page<PrivacyAccessLog> expectedPage = new PageImpl<>(Collections.singletonList(log));

        when(privacyAccessLogRepository.findByEmployeeIdAndTenantId(employeeId, tenantId, pageable))
            .thenReturn(expectedPage);

        Page<PrivacyAccessLog> result = privacyAuditService.getLogsByEmployee(employeeId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEmployeeId()).isEqualTo(employeeId);
        verify(privacyAccessLogRepository).findByEmployeeIdAndTenantId(employeeId, tenantId, pageable);
    }

    @Test
    void getLogsByActor_returnsPaginated() {
        Pageable pageable = PageRequest.of(0, 10);
        PrivacyAccessLog log = PrivacyAccessLog.builder()
            .tenantId(tenantId)
            .actorId(actorId)
            .actorName("testuser")
            .employeeId(employeeId)
            .fieldName("mobile")
            .reason("조회")
            .build();
        Page<PrivacyAccessLog> expectedPage = new PageImpl<>(Collections.singletonList(log));

        when(privacyAccessLogRepository.findByActorIdAndTenantId(actorId, tenantId, pageable))
            .thenReturn(expectedPage);

        Page<PrivacyAccessLog> result = privacyAuditService.getLogsByActor(actorId, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getActorId()).isEqualTo(actorId);
        verify(privacyAccessLogRepository).findByActorIdAndTenantId(actorId, tenantId, pageable);
    }

    @Test
    void logAccess_setsCorrectTenantId() {
        UUID customTenantId = UUID.randomUUID();
        TenantContext.clear();
        TenantContext.setCurrentTenant(customTenantId);

        when(privacyAccessLogRepository.save(any(PrivacyAccessLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        privacyAuditService.logAccess(employeeId, "email", "연락처 확인");

        ArgumentCaptor<PrivacyAccessLog> captor = ArgumentCaptor.forClass(PrivacyAccessLog.class);
        verify(privacyAccessLogRepository).save(captor.capture());

        PrivacyAccessLog saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(customTenantId);
    }
}
