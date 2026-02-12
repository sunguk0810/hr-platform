package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.domain.entity.LeaveBalance;
import com.hrsaas.attendance.domain.entity.LeaveType;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.repository.LeaveBalanceRepository;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveAccrualServiceRegressionTest {

    @Mock
    private LeaveAccrualRuleRepository ruleRepository;

    @Mock
    private LeaveBalanceRepository balanceRepository;

    @InjectMocks
    private LeaveAccrualService leaveAccrualService;

    private static final UUID TENANT_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void testGenerateAnnualLeave_Optimized_Behavior() {
        int employeeCount = 10;
        List<LeaveAccrualService.EmployeeLeaveInfo> employees = new ArrayList<>();
        for (int i = 0; i < employeeCount; i++) {
            employees.add(LeaveAccrualService.EmployeeLeaveInfo.builder()
                    .employeeId(UUID.randomUUID())
                    .hireDate(LocalDate.now().minusYears(1))
                    .build());
        }

        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .leaveTypeCode("ANNUAL")
                .accrualType("YEARLY")
                .baseEntitlement(BigDecimal.TEN)
                .build();

        when(ruleRepository.findActiveByTenantId(TENANT_ID)).thenReturn(List.of(rule));
        // Mock bulk fetch
        when(balanceRepository.findByEmployeeIdsAndYear(eq(TENANT_ID), any(), eq(2025)))
                .thenReturn(new ArrayList<>());

        leaveAccrualService.generateAnnualLeave(TENANT_ID, 2025, employees);

        // Verify Optimized calls:
        verify(ruleRepository, times(1)).findActiveByTenantId(TENANT_ID);

        // Single bulk fetch
        verify(balanceRepository, times(1)).findByEmployeeIdsAndYear(eq(TENANT_ID), any(), eq(2025));

        // Single bulk save
        verify(balanceRepository, times(1)).saveAll(any());

        // Verify N+1 calls are eliminated
        verify(balanceRepository, never()).findByEmployeeIdAndYearAndType(any(), any(), anyInt(), any());
        verify(balanceRepository, never()).save(any(LeaveBalance.class));
    }
}
