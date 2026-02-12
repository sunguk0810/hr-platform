package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.dto.response.DashboardBirthdayResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeSummaryResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeDashboardServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Spy
    @InjectMocks
    private EmployeeDashboardService employeeDashboardService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("getBirthdays - Normal Case (Middle of Year)")
    void getBirthdays_NormalCase() {
        // Given
        LocalDate today = LocalDate.of(2023, 6, 15);
        doReturn(today).when(employeeDashboardService).getToday();

        Employee employee1 = Employee.builder().name("User A").build();
        Employee employee2 = Employee.builder().name("User B").build();

        // Expect:
        // today = 615
        // upcoming start = 616 (tomorrow)
        // upcoming end = 622 (today + 7 days)

        when(employeeRepository.findUpcomingBirthdays(tenantId, 615, 615))
            .thenReturn(List.of(employee1));
        when(employeeRepository.findUpcomingBirthdays(tenantId, 616, 622))
            .thenReturn(List.of(employee2));

        // When
        DashboardBirthdayResponse response = employeeDashboardService.getBirthdays();

        // Then
        assertThat(response.getToday()).hasSize(1);
        assertThat(response.getToday().get(0).getName()).isEqualTo("User A");

        assertThat(response.getUpcoming()).hasSize(1);
        assertThat(response.getUpcoming().get(0).getName()).isEqualTo("User B");

        verify(employeeRepository).findUpcomingBirthdays(tenantId, 615, 615);
        verify(employeeRepository).findUpcomingBirthdays(tenantId, 616, 622);
    }

    @Test
    @DisplayName("getBirthdays - Year Wrap-Around (End of Year)")
    void getBirthdays_YearWrapAround() {
        // Given
        LocalDate today = LocalDate.of(2023, 12, 28);
        doReturn(today).when(employeeDashboardService).getToday();

        Employee employee1 = Employee.builder().name("User Today").build();
        Employee employee2 = Employee.builder().name("User Dec").build();
        Employee employee3 = Employee.builder().name("User Jan").build();

        // today = 1228
        // tomorrow = 1229
        // today + 7 = 2024-01-04 -> 104
        // Logic: 1229 > 104, so split query
        // Part 1: 1229 ~ 1231
        // Part 2: 101 ~ 104

        when(employeeRepository.findUpcomingBirthdays(tenantId, 1228, 1228))
            .thenReturn(List.of(employee1));
        when(employeeRepository.findUpcomingBirthdays(tenantId, 1229, 1231))
            .thenReturn(List.of(employee2));
        when(employeeRepository.findUpcomingBirthdays(tenantId, 101, 104))
            .thenReturn(List.of(employee3));

        // When
        DashboardBirthdayResponse response = employeeDashboardService.getBirthdays();

        // Then
        assertThat(response.getToday()).hasSize(1);

        assertThat(response.getUpcoming()).hasSize(2);
        assertThat(response.getUpcoming())
            .extracting(DashboardBirthdayResponse.BirthdayItem::getName)
            .containsExactly("User Dec", "User Jan");

        verify(employeeRepository).findUpcomingBirthdays(tenantId, 1228, 1228);
        verify(employeeRepository).findUpcomingBirthdays(tenantId, 1229, 1231);
        verify(employeeRepository).findUpcomingBirthdays(tenantId, 101, 104);
    }

    @Test
    @DisplayName("getEmployeeSummary - Calculates stats for current month")
    void getEmployeeSummary() {
        // Given
        YearMonth currentMonth = YearMonth.of(2023, 10);
        doReturn(currentMonth).when(employeeDashboardService).getCurrentMonth();

        LocalDate start = LocalDate.of(2023, 10, 1);
        LocalDate end = LocalDate.of(2023, 10, 31);

        when(employeeRepository.countByTenantId(tenantId)).thenReturn(100L);
        when(employeeRepository.countByTenantIdAndStatus(tenantId, EmployeeStatus.ACTIVE)).thenReturn(90L);
        when(employeeRepository.countNewHires(tenantId, start, end)).thenReturn(5L);
        when(employeeRepository.countResigned(tenantId, start, end)).thenReturn(2L);

        // When
        EmployeeSummaryResponse response = employeeDashboardService.getEmployeeSummary();

        // Then
        assertThat(response.getTotalEmployees()).isEqualTo(100L);
        assertThat(response.getActiveEmployees()).isEqualTo(90L);
        assertThat(response.getNewHiresThisMonth()).isEqualTo(5L);
        assertThat(response.getResignedThisMonth()).isEqualTo(2L);

        verify(employeeRepository).countByTenantId(tenantId);
        verify(employeeRepository).countByTenantIdAndStatus(tenantId, EmployeeStatus.ACTIVE);
        verify(employeeRepository).countNewHires(tenantId, start, end);
        verify(employeeRepository).countResigned(tenantId, start, end);
    }
}
