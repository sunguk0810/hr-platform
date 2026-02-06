package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveTypeConfig;
import com.hrsaas.attendance.repository.LeaveTypeConfigRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveTypeConfigService {

    private final LeaveTypeConfigRepository configRepository;

    public List<LeaveTypeConfig> getActiveConfigs() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return configRepository.findActiveByTenantId(tenantId);
    }

    public List<LeaveTypeConfig> getAllConfigs() {
        UUID tenantId = TenantContext.getCurrentTenant();
        return configRepository.findAllByTenantId(tenantId);
    }

    public LeaveTypeConfig getByCode(String code) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return configRepository.findByTenantIdAndCode(tenantId, code)
            .orElseThrow(() -> new IllegalArgumentException("Leave type config not found: " + code));
    }

    @Transactional
    public LeaveTypeConfig create(LeaveTypeConfig config) {
        return configRepository.save(config);
    }

    @Transactional
    public LeaveTypeConfig update(UUID id, LeaveTypeConfig updated) {
        LeaveTypeConfig config = configRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Leave type config not found: " + id));
        config.setName(updated.getName());
        config.setIsPaid(updated.getIsPaid());
        config.setMaxDaysPerYear(updated.getMaxDaysPerYear());
        config.setRequiresApproval(updated.getRequiresApproval());
        config.setMinNoticeDays(updated.getMinNoticeDays());
        config.setAllowHalfDay(updated.getAllowHalfDay());
        config.setAllowHourly(updated.getAllowHourly());
        config.setDeductFromAnnual(updated.getDeductFromAnnual());
        config.setMinServiceMonths(updated.getMinServiceMonths());
        config.setGenderRestriction(updated.getGenderRestriction());
        config.setMaxConsecutiveDays(updated.getMaxConsecutiveDays());
        config.setBlackoutPeriods(updated.getBlackoutPeriods());
        config.setApprovalTemplateCode(updated.getApprovalTemplateCode());
        config.setIsActive(updated.getIsActive());
        return configRepository.save(config);
    }

    @Transactional
    public void delete(UUID id) {
        configRepository.deleteById(id);
    }
}
