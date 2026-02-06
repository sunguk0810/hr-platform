package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveAccrualService Tests")
class LeaveAccrualServiceTest {

    @Mock
    private LeaveAccrualRuleRepository ruleRepository;

    @Mock
    private LeaveBalanceRepository balanceRepository;

    @InjectMocks
    private LeaveAccrualService leaveAccrualService;

    @Captor
    private ArgumentCaptor<LeaveBalance> balanceCaptor;

    private static final UUID TENANT_ID = UUID.randomUUID();
    private static final UUID EMPLOYEE_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("calculateEntitlement: first year employee returns 15 days")
    void calculateEntitlement_firstYearEmployee_returns15Days() {
        // given
        LocalDate hireDate = LocalDate.of(2025, 6, 15);
        int year = 2026;
        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .baseEntitlement(new BigDecimal("15"))
                .serviceYearBonuses(null)
                .build();

        // when
        BigDecimal entitlement = leaveAccrualService.calculateEntitlement(hireDate, year, rule);

        // then
        assertThat(entitlement).isEqualByComparingTo(new BigDecimal("15"));
    }

    @Test
    @DisplayName("calculateEntitlement: 3 year employee gets base + bonus")
    void calculateEntitlement_3YearEmployee_getsBonus() {
        // given
        LocalDate hireDate = LocalDate.of(2022, 1, 1);
        int year = 2026; // serviceYears = 4 (between 2022-01-01 and 2026-01-01)
        // But we want 3yr scenario: hire 2023-01-01, year=2026 -> serviceYears=3
        LocalDate hireDate3yr = LocalDate.of(2023, 1, 1);
        String bonusJson = "[{\"minYears\":3,\"maxYears\":5,\"bonusDays\":2}]";
        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .baseEntitlement(new BigDecimal("15"))
                .serviceYearBonuses(bonusJson)
                .build();

        // when
        BigDecimal entitlement = leaveAccrualService.calculateEntitlement(hireDate3yr, year, rule);

        // then
        // base 15 + bonus 2 = 17
        assertThat(entitlement).isEqualByComparingTo(new BigDecimal("17"));
    }

    @Test
    @DisplayName("calculateEntitlement: over 25 days capped at 25 (Korean labor law)")
    void calculateEntitlement_over25Days_cappedAt25() {
        // given
        LocalDate hireDate = LocalDate.of(2000, 1, 1);
        int year = 2026; // serviceYears = 26
        // Large bonus that would push total above 25
        String bonusJson = "[{\"minYears\":20,\"bonusDays\":15}]";
        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .baseEntitlement(new BigDecimal("15"))
                .serviceYearBonuses(bonusJson)
                .build();

        // when
        BigDecimal entitlement = leaveAccrualService.calculateEntitlement(hireDate, year, rule);

        // then
        // base 15 + bonus 15 = 30, but capped at 25
        assertThat(entitlement).isEqualByComparingTo(new BigDecimal("25"));
    }

    @Test
    @DisplayName("generateForEmployee: no rule found, skips gracefully (no balance created)")
    void generateForEmployee_noRule_skips() {
        // given
        LocalDate hireDate = LocalDate.of(2024, 3, 1);
        int year = 2026;
        when(ruleRepository.findActiveByTenantId(TENANT_ID)).thenReturn(Collections.emptyList());

        // when
        leaveAccrualService.generateForEmployee(EMPLOYEE_ID, hireDate, year);

        // then
        verify(ruleRepository).findActiveByTenantId(TENANT_ID);
        verify(balanceRepository, never()).save(any(LeaveBalance.class));
    }

    @Test
    @DisplayName("generateForEmployee: yearly rule creates LeaveBalance")
    void generateForEmployee_yearlyRule_createsBalance() {
        // given
        LocalDate hireDate = LocalDate.of(2024, 3, 1);
        int year = 2026;
        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .leaveTypeCode("ANNUAL")
                .accrualType("YEARLY")
                .baseEntitlement(new BigDecimal("15"))
                .serviceYearBonuses(null)
                .build();

        when(ruleRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(rule));
        when(balanceRepository.findByEmployeeIdAndYearAndType(
                eq(TENANT_ID), eq(EMPLOYEE_ID), eq(year), eq(LeaveType.ANNUAL)))
                .thenReturn(Optional.empty());
        when(balanceRepository.save(any(LeaveBalance.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // when
        leaveAccrualService.generateForEmployee(EMPLOYEE_ID, hireDate, year);

        // then
        verify(balanceRepository).save(balanceCaptor.capture());
        LeaveBalance savedBalance = balanceCaptor.getValue();

        assertThat(savedBalance.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(savedBalance.getEmployeeId()).isEqualTo(EMPLOYEE_ID);
        assertThat(savedBalance.getYear()).isEqualTo(year);
        assertThat(savedBalance.getLeaveType()).isEqualTo(LeaveType.ANNUAL);
        assertThat(savedBalance.getTotalDays()).isEqualByComparingTo(new BigDecimal("15"));
    }
}
