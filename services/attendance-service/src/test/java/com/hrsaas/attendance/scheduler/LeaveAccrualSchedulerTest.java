package com.hrsaas.attendance.scheduler;

import com.hrsaas.attendance.client.EmployeeServiceClient;
import com.hrsaas.attendance.client.TenantServiceClient;
import com.hrsaas.attendance.client.dto.EmployeeBasicDto;
import com.hrsaas.attendance.client.dto.TenantBasicDto;
import com.hrsaas.attendance.domain.entity.LeaveAccrualRule;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.service.LeaveAccrualService;
import com.hrsaas.attendance.service.LeaveCarryOverService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveAccrualScheduler Tests")
class LeaveAccrualSchedulerTest {

    @Mock
    private LeaveAccrualService accrualService;

    @Mock
    private LeaveCarryOverService carryOverService;

    @Mock
    private TenantServiceClient tenantServiceClient;

    @Mock
    private EmployeeServiceClient employeeServiceClient;

    @Mock
    private LeaveAccrualRuleRepository ruleRepository;

    @InjectMocks
    private LeaveAccrualScheduler scheduler;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private TenantBasicDto activeTenant(UUID id) {
        return TenantBasicDto.builder().id(id).code("TEST").name("Test").status("ACTIVE").build();
    }

    private EmployeeBasicDto activeEmployee(UUID id, LocalDate hireDate) {
        return EmployeeBasicDto.builder().id(id).name("직원").hireDate(hireDate).gender("M").status("ACTIVE").build();
    }

    @Test
    @DisplayName("generateYearlyLeave: multi-tenant processes all")
    void generateYearlyLeave_multiTenant_processesAll() {
        // given
        UUID tenant1Id = UUID.randomUUID();
        UUID tenant2Id = UUID.randomUUID();
        List<TenantBasicDto> tenants = List.of(activeTenant(tenant1Id), activeTenant(tenant2Id));
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(tenants).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));
        when(employeeServiceClient.getActiveEmployees(any())).thenReturn(ApiResponse.success(List.of(
                activeEmployee(UUID.randomUUID(), LocalDate.of(2024, 1, 1)))));
        when(carryOverService.processCarryOver(any(), anyInt())).thenReturn(0);
        when(accrualService.generateAnnualLeave(any(), anyInt(), anyList())).thenReturn(1);

        // when
        scheduler.generateYearlyLeave();

        // then
        verify(accrualService, times(2)).generateAnnualLeave(any(), anyInt(), anyList());
        verify(carryOverService, times(2)).processCarryOver(any(), anyInt());
    }

    @Test
    @DisplayName("generateYearlyLeave: feign failure continues next tenant")
    void generateYearlyLeave_feignFailure_continuesNextTenant() {
        // given
        UUID tenant1Id = UUID.randomUUID();
        UUID tenant2Id = UUID.randomUUID();
        List<TenantBasicDto> tenants = List.of(activeTenant(tenant1Id), activeTenant(tenant2Id));
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(tenants).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        // First tenant fails when fetching employees
        when(employeeServiceClient.getActiveEmployees(any()))
                .thenReturn(ApiResponse.success(Collections.emptyList()))
                .thenReturn(ApiResponse.success(List.of(
                        activeEmployee(UUID.randomUUID(), LocalDate.of(2024, 1, 1)))));
        when(carryOverService.processCarryOver(any(), anyInt())).thenReturn(0);
        when(accrualService.generateAnnualLeave(any(), anyInt(), anyList())).thenReturn(1);

        // when
        scheduler.generateYearlyLeave();

        // then - both tenants processed
        verify(accrualService, times(2)).generateAnnualLeave(any(), anyInt(), anyList());
    }

    @Test
    @DisplayName("generateMonthlyLeave: monthly rules processes correctly")
    void generateMonthlyLeave_monthlyRules_processesCorrectly() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(List.of(activeTenant(tenantId))).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        LeaveAccrualRule monthlyRule = LeaveAccrualRule.builder()
                .leaveTypeCode("ANNUAL").accrualType("MONTHLY")
                .baseEntitlement(new BigDecimal("1.25")).build();
        when(ruleRepository.findActiveByTenantIdAndAccrualType(tenantId, "MONTHLY"))
                .thenReturn(List.of(monthlyRule));

        UUID empId = UUID.randomUUID();
        when(employeeServiceClient.getActiveEmployees(any()))
                .thenReturn(ApiResponse.success(List.of(activeEmployee(empId, LocalDate.of(2024, 3, 1)))));

        // when
        scheduler.generateMonthlyLeave();

        // then
        verify(accrualService).generateForEmployee(eq(empId), any(), anyInt());
    }

    @Test
    @DisplayName("generateMonthlyLeave: no rules skips")
    void generateMonthlyLeave_noRules_skips() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(List.of(activeTenant(tenantId))).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));
        when(ruleRepository.findActiveByTenantIdAndAccrualType(tenantId, "MONTHLY"))
                .thenReturn(Collections.emptyList());

        // when
        scheduler.generateMonthlyLeave();

        // then
        verify(accrualService, never()).generateForEmployee(any(), any(), anyInt());
    }

    @Test
    @DisplayName("checkHireDateBasedAccrual: anniversary today generates")
    void checkHireDateBasedAccrual_anniversaryToday_generates() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(List.of(activeTenant(tenantId))).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .leaveTypeCode("ANNUAL").accrualType("HIRE_DATE_BASED").build();
        when(ruleRepository.findActiveByTenantIdAndAccrualType(tenantId, "HIRE_DATE_BASED"))
                .thenReturn(List.of(rule));

        // Employee hired on same month/day but different year
        LocalDate today = LocalDate.now();
        LocalDate hireDate = today.minusYears(2);
        UUID empId = UUID.randomUUID();
        when(employeeServiceClient.getActiveEmployees(any()))
                .thenReturn(ApiResponse.success(List.of(activeEmployee(empId, hireDate))));

        // when
        scheduler.checkHireDateBasedAccrual();

        // then
        verify(accrualService).generateForEmployee(eq(empId), eq(hireDate), eq(today.getYear()));
    }

    @Test
    @DisplayName("checkHireDateBasedAccrual: not anniversary skips")
    void checkHireDateBasedAccrual_notAnniversary_skips() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
                .content(List.of(activeTenant(tenantId))).build();

        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        LeaveAccrualRule rule = LeaveAccrualRule.builder()
                .leaveTypeCode("ANNUAL").accrualType("HIRE_DATE_BASED").build();
        when(ruleRepository.findActiveByTenantIdAndAccrualType(tenantId, "HIRE_DATE_BASED"))
                .thenReturn(List.of(rule));

        // Employee hired on different month
        LocalDate hireDate = LocalDate.now().minusMonths(3).withDayOfMonth(15);
        UUID empId = UUID.randomUUID();
        when(employeeServiceClient.getActiveEmployees(any()))
                .thenReturn(ApiResponse.success(List.of(activeEmployee(empId, hireDate))));

        // when
        scheduler.checkHireDateBasedAccrual();

        // then
        verify(accrualService, never()).generateForEmployee(any(), any(), anyInt());
    }
}
