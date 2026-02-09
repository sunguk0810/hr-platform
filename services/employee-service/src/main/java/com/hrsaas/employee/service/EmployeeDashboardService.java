package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.dto.response.DashboardBirthdayResponse;
import com.hrsaas.employee.domain.dto.response.EmployeeSummaryResponse;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeDashboardService {

    private final EmployeeRepository employeeRepository;

    public DashboardBirthdayResponse getBirthdays() {
        UUID tenantId = TenantContext.getCurrentTenant();
        LocalDate today = LocalDate.now();

        int todayMonthDay = today.getMonthValue() * 100 + today.getDayOfMonth();

        // 오늘 생일
        List<Employee> todayBirthdays = employeeRepository
            .findUpcomingBirthdays(tenantId, todayMonthDay, todayMonthDay);

        // 다가오는 생일 (내일 ~ 7일 후)
        LocalDate endDate = today.plusDays(7);
        int tomorrowMonthDay = today.plusDays(1).getMonthValue() * 100 + today.plusDays(1).getDayOfMonth();
        int endMonthDay = endDate.getMonthValue() * 100 + endDate.getDayOfMonth();

        List<Employee> upcomingBirthdays;
        if (tomorrowMonthDay <= endMonthDay) {
            upcomingBirthdays = employeeRepository
                .findUpcomingBirthdays(tenantId, tomorrowMonthDay, endMonthDay);
        } else {
            // 연말 → 연초 wrap-around (12/29 ~ 1/5 같은 경우)
            List<Employee> part1 = employeeRepository
                .findUpcomingBirthdays(tenantId, tomorrowMonthDay, 1231);
            List<Employee> part2 = employeeRepository
                .findUpcomingBirthdays(tenantId, 101, endMonthDay);
            upcomingBirthdays = new java.util.ArrayList<>(part1);
            upcomingBirthdays.addAll(part2);
        }

        return DashboardBirthdayResponse.builder()
            .today(todayBirthdays.stream()
                .map(DashboardBirthdayResponse.BirthdayItem::from)
                .toList())
            .upcoming(upcomingBirthdays.stream()
                .map(DashboardBirthdayResponse.BirthdayItem::from)
                .toList())
            .build();
    }

    public EmployeeSummaryResponse getEmployeeSummary() {
        UUID tenantId = TenantContext.getCurrentTenant();
        YearMonth currentMonth = YearMonth.now();
        LocalDate monthStart = currentMonth.atDay(1);
        LocalDate monthEnd = currentMonth.atEndOfMonth();

        long totalEmployees = employeeRepository.countByTenantId(tenantId);
        long activeEmployees = employeeRepository.countByTenantIdAndStatus(tenantId, EmployeeStatus.ACTIVE);
        long newHires = employeeRepository.countNewHires(tenantId, monthStart, monthEnd);
        long resigned = employeeRepository.countResigned(tenantId, monthStart, monthEnd);

        return EmployeeSummaryResponse.builder()
            .totalEmployees(totalEmployees)
            .activeEmployees(activeEmployees)
            .newHiresThisMonth(newHires)
            .resignedThisMonth(resigned)
            .build();
    }
}
