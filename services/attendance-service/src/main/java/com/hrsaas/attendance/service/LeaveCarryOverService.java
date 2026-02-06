package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveCarryOverService {

    private final LeaveBalanceRepository balanceRepository;
    private final LeaveAccrualRuleRepository ruleRepository;

    /**
     * 전년도 잔여 연차 이월 처리
     */
    @Transactional
    public int processCarryOver(UUID tenantId, int fromYear) {
        TenantContext.setCurrentTenant(tenantId);
        int toYear = fromYear + 1;
        int count = 0;

        List<LeaveBalance> previousBalances = balanceRepository.findByEmployeeIdAndYear(tenantId, null, fromYear);

        for (LeaveBalance prevBalance : previousBalances) {
            BigDecimal remaining = prevBalance.getAvailableDays();
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

            LeaveAccrualRule rule = ruleRepository.findByTenantIdAndLeaveTypeCode(
                tenantId, prevBalance.getLeaveType().name()).orElse(null);

            BigDecimal maxCarryOver = rule != null ? rule.getMaxCarryOverDays() : BigDecimal.ZERO;
            if (maxCarryOver.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal carryOverDays = remaining.min(maxCarryOver);

            LeaveBalance newBalance = balanceRepository.findByEmployeeIdAndYearAndType(
                tenantId, prevBalance.getEmployeeId(), toYear, prevBalance.getLeaveType())
                .orElse(null);

            if (newBalance != null) {
                newBalance.setCarriedOverDays(carryOverDays);
                balanceRepository.save(newBalance);
                count++;
                log.debug("Carry over: employeeId={}, type={}, days={}",
                    prevBalance.getEmployeeId(), prevBalance.getLeaveType(), carryOverDays);
            }
        }

        log.info("Processed {} carry-overs from {} to {}", count, fromYear, toYear);
        return count;
    }
}
