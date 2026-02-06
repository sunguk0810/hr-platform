package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.common.core.util.JsonUtils;
import com.hrsaas.common.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveAccrualService {

    private final LeaveAccrualRuleRepository ruleRepository;
    private final LeaveBalanceRepository balanceRepository;

    /**
     * 전체 직원 연차 생성 (특정 테넌트)
     */
    @Transactional
    public int generateAnnualLeave(UUID tenantId, int year, List<EmployeeLeaveInfo> employees) {
        TenantContext.setCurrentTenant(tenantId);
        List<LeaveAccrualRule> rules = ruleRepository.findActiveByTenantId(tenantId);
        int count = 0;

        for (EmployeeLeaveInfo emp : employees) {
            for (LeaveAccrualRule rule : rules) {
                if (shouldGenerate(rule, emp, year)) {
                    BigDecimal entitlement = calculateEntitlement(emp.getHireDate(), year, rule);
                    createOrUpdateBalance(tenantId, emp.getEmployeeId(), year, rule.getLeaveTypeCode(), entitlement);
                    count++;
                }
            }
        }

        log.info("Generated {} leave balances for tenant={}, year={}", count, tenantId, year);
        return count;
    }

    /**
     * 개별 직원 연차 생성
     */
    @Transactional
    public void generateForEmployee(UUID employeeId, LocalDate hireDate, int year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<LeaveAccrualRule> rules = ruleRepository.findActiveByTenantId(tenantId);

        for (LeaveAccrualRule rule : rules) {
            BigDecimal entitlement = calculateEntitlement(hireDate, year, rule);
            createOrUpdateBalance(tenantId, employeeId, year, rule.getLeaveTypeCode(), entitlement);
        }
    }

    /**
     * 근속연수별 연차 일수 계산
     */
    public BigDecimal calculateEntitlement(LocalDate hireDate, int year, LeaveAccrualRule rule) {
        BigDecimal base = rule.getBaseEntitlement();

        if (hireDate == null) return base;

        long serviceYears = ChronoUnit.YEARS.between(hireDate, LocalDate.of(year, 1, 1));
        if (serviceYears < 0) serviceYears = 0;

        BigDecimal bonus = BigDecimal.ZERO;
        if (rule.getServiceYearBonuses() != null) {
            try {
                List<Map<String, Object>> bonuses = JsonUtils.fromJson(
                    rule.getServiceYearBonuses(),
                    new TypeReference<>() {}
                );

                for (Map<String, Object> b : bonuses) {
                    int minYears = ((Number) b.get("minYears")).intValue();
                    int maxYears = b.containsKey("maxYears") ? ((Number) b.get("maxYears")).intValue() : Integer.MAX_VALUE;
                    BigDecimal bonusDays = new BigDecimal(b.get("bonusDays").toString());

                    if (serviceYears >= minYears && serviceYears <= maxYears) {
                        bonus = bonus.add(bonusDays);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse service year bonuses: {}", rule.getServiceYearBonuses(), e);
            }
        }

        BigDecimal total = base.add(bonus);
        // Korean labor law cap: max 25 days for annual leave
        if (total.compareTo(new BigDecimal("25")) > 0) {
            total = new BigDecimal("25");
        }

        return total;
    }

    private boolean shouldGenerate(LeaveAccrualRule rule, EmployeeLeaveInfo emp, int year) {
        if ("YEARLY".equals(rule.getAccrualType())) return true;
        if ("HIRE_DATE_BASED".equals(rule.getAccrualType())) {
            return emp.getHireDate() != null && emp.getHireDate().getYear() <= year;
        }
        return true;
    }

    private void createOrUpdateBalance(UUID tenantId, UUID employeeId, int year, String leaveTypeCode, BigDecimal entitlement) {
        LeaveType leaveType;
        try {
            leaveType = LeaveType.valueOf(leaveTypeCode);
        } catch (IllegalArgumentException e) {
            leaveType = LeaveType.ANNUAL; // fallback
        }

        LeaveType finalLeaveType = leaveType;
        LeaveBalance balance = balanceRepository.findByEmployeeIdAndYearAndType(tenantId, employeeId, year, leaveType)
            .orElseGet(() -> LeaveBalance.builder()
                .tenantId(tenantId)
                .employeeId(employeeId)
                .year(year)
                .leaveType(finalLeaveType)
                .totalDays(BigDecimal.ZERO)
                .usedDays(BigDecimal.ZERO)
                .pendingDays(BigDecimal.ZERO)
                .carriedOverDays(BigDecimal.ZERO)
                .build());

        balance.setTotalDays(entitlement);
        balanceRepository.save(balance);
    }

    /**
     * Employee info DTO for accrual calculation
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EmployeeLeaveInfo {
        private UUID employeeId;
        private LocalDate hireDate;
        private String gender;
    }
}
