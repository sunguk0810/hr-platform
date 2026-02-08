package com.hrsaas.tenant.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.tenant.domain.entity.PlanType;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.domain.event.ContractExpiryWarningEvent;
import com.hrsaas.tenant.domain.event.TenantStatusChangedEvent;
import com.hrsaas.tenant.repository.TenantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractExpirySchedulerTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private ContractExpiryScheduler scheduler;

    private Tenant createTenant(UUID id, String code, TenantStatus status, LocalDate contractEndDate) {
        Tenant tenant = Tenant.builder()
                .code(code)
                .name("Test Tenant " + code)
                .planType(PlanType.STANDARD)
                .contractEndDate(contractEndDate)
                .build();
        // Set id via reflection since BaseEntity.id is generated
        setId(tenant, id);
        // Builder sets status to ACTIVE by default; adjust if needed
        if (status == TenantStatus.SUSPENDED) {
            tenant.suspend();
        } else if (status == TenantStatus.TERMINATED) {
            tenant.terminate();
        }
        return tenant;
    }

    private void setId(Tenant tenant, UUID id) {
        try {
            Field idField = tenant.getClass().getSuperclass().getSuperclass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(tenant, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set tenant id", e);
        }
    }

    @Test
    void sendExpiryWarnings_tenantsExpiringIn30Days_publishesEvents() {
        LocalDate today = LocalDate.now();
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "TENANT_A", TenantStatus.ACTIVE, today.plusDays(30));

        when(tenantRepository.findByContractEndDate(today.plusDays(30)))
                .thenReturn(List.of(tenant));
        when(tenantRepository.findByContractEndDate(today.plusDays(7)))
                .thenReturn(Collections.emptyList());
        when(tenantRepository.findByContractEndDate(today.plusDays(1)))
                .thenReturn(Collections.emptyList());

        scheduler.sendExpiryWarnings(today);

        verify(eventPublisher, times(1)).publish(any(ContractExpiryWarningEvent.class));
    }

    @Test
    void suspendExpiredTenants_contractExpired_suspends() {
        LocalDate today = LocalDate.now();
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "TENANT_B", TenantStatus.ACTIVE, today.minusDays(1));

        when(tenantRepository.findByContractEndDateBeforeAndStatus(today, TenantStatus.ACTIVE))
                .thenReturn(List.of(tenant));

        scheduler.suspendExpiredTenants(today);

        verify(tenantRepository, times(1)).save(tenant);
        verify(eventPublisher, times(1)).publish(any(TenantStatusChangedEvent.class));
    }

    @Test
    void terminateOverdueTenants_over90DaysSuspended_terminates() {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.minusDays(90);
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "TENANT_C", TenantStatus.SUSPENDED, today.minusDays(100));

        when(tenantRepository.findByContractEndDateBeforeAndStatus(cutoff, TenantStatus.SUSPENDED))
                .thenReturn(List.of(tenant));

        scheduler.terminateOverdueTenants(today);

        verify(tenantRepository, times(1)).save(tenant);
        verify(eventPublisher, times(1)).publish(any(TenantStatusChangedEvent.class));
    }

    @Test
    void sendExpiryWarnings_inactiveTenantsSkipped() {
        LocalDate today = LocalDate.now();
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = createTenant(tenantId, "TENANT_D", TenantStatus.SUSPENDED, today.plusDays(30));

        when(tenantRepository.findByContractEndDate(today.plusDays(30)))
                .thenReturn(List.of(tenant));
        when(tenantRepository.findByContractEndDate(today.plusDays(7)))
                .thenReturn(Collections.emptyList());
        when(tenantRepository.findByContractEndDate(today.plusDays(1)))
                .thenReturn(Collections.emptyList());

        scheduler.sendExpiryWarnings(today);

        verify(eventPublisher, never()).publish(any(ContractExpiryWarningEvent.class));
    }
}
