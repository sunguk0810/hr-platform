package com.hrsaas.tenant.scheduler;

import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.repository.TenantFeatureRepository;
import com.hrsaas.tenant.repository.TenantPolicyRepository;
import com.hrsaas.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantCleanupScheduler {

    private final TenantRepository tenantRepository;
    private final TenantPolicyRepository tenantPolicyRepository;
    private final TenantFeatureRepository tenantFeatureRepository;

    @Scheduled(cron = "0 0 3 * * MON")
    @Transactional
    public void cleanupTerminatedTenants() {
        log.info("Tenant cleanup started");

        List<Tenant> terminated = tenantRepository.findByStatus(TenantStatus.TERMINATED);
        int cleanedCount = 0;

        for (Tenant tenant : terminated) {
            if (tenant.getDataRetentionUntil() != null && tenant.getDataRetentionUntil().isBefore(Instant.now())) {
                tenantPolicyRepository.findAllByTenantId(tenant.getId())
                    .forEach(tenantPolicyRepository::delete);
                tenantFeatureRepository.findAllByTenantId(tenant.getId())
                    .forEach(tenantFeatureRepository::delete);
                cleanedCount++;
                log.info("Cleaned up data for terminated tenant: tenantId={}", tenant.getId());
            }
        }

        log.info("Tenant cleanup completed: cleaned={}", cleanedCount);
    }
}
