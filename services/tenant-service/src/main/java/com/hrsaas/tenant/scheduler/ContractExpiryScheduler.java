package com.hrsaas.tenant.scheduler;

import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.domain.event.ContractExpiryWarningEvent;
import com.hrsaas.tenant.domain.event.TenantStatusChangedEvent;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContractExpiryScheduler {

    private final TenantRepository tenantRepository;
    private final EventPublisher eventPublisher;

    @Scheduled(cron = "0 0 1 * * *")
    public void checkContractExpiry() {
        log.info("Contract expiry check started");
        LocalDate today = LocalDate.now();

        sendExpiryWarnings(today);
        suspendExpiredTenants(today);
        terminateOverdueTenants(today);

        log.info("Contract expiry check completed");
    }

    @Transactional
    public void sendExpiryWarnings(LocalDate today) {
        int[] warningDays = {30, 7, 1};
        for (int days : warningDays) {
            LocalDate targetDate = today.plusDays(days);
            List<Tenant> tenants = tenantRepository.findByContractEndDate(targetDate);
            for (Tenant tenant : tenants) {
                if (tenant.getStatus() != TenantStatus.ACTIVE) continue;
                eventPublisher.publish(ContractExpiryWarningEvent.builder()
                    .tenantId(tenant.getId())
                    .tenantCode(tenant.getCode())
                    .contractEndDate(tenant.getContractEndDate())
                    .daysUntilExpiry(days)
                    .build());
                log.info("Contract expiry warning sent: tenantId={}, daysUntil={}", tenant.getId(), days);
            }
        }
    }

    @Transactional
    public void suspendExpiredTenants(LocalDate today) {
        List<Tenant> expired = tenantRepository.findByContractEndDateBeforeAndStatus(today, TenantStatus.ACTIVE);
        for (Tenant tenant : expired) {
            TenantStatus previous = tenant.getStatus();
            tenant.suspend();
            tenantRepository.save(tenant);
            eventPublisher.publish(TenantStatusChangedEvent.builder()
                .tenantId(tenant.getId())
                .tenantCode(tenant.getCode())
                .previousStatus(previous)
                .newStatus(TenantStatus.SUSPENDED)
                .build());
            log.info("Tenant suspended due to contract expiry: tenantId={}", tenant.getId());
        }
    }

    @Transactional
    public void terminateOverdueTenants(LocalDate today) {
        LocalDate cutoff = today.minusDays(90);
        List<Tenant> overdue = tenantRepository.findByContractEndDateBeforeAndStatus(cutoff, TenantStatus.SUSPENDED);
        for (Tenant tenant : overdue) {
            TenantStatus previous = tenant.getStatus();
            tenant.terminate();
            tenantRepository.save(tenant);
            eventPublisher.publish(TenantStatusChangedEvent.builder()
                .tenantId(tenant.getId())
                .tenantCode(tenant.getCode())
                .previousStatus(previous)
                .newStatus(TenantStatus.TERMINATED)
                .build());
            log.info("Tenant terminated due to prolonged suspension: tenantId={}", tenant.getId());
        }
    }
}
