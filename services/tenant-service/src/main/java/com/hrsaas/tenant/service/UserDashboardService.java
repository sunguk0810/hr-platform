package com.hrsaas.tenant.service;

import com.hrsaas.tenant.client.ApprovalServiceClient;
import com.hrsaas.tenant.client.AttendanceServiceClient;
import com.hrsaas.tenant.client.EmployeeServiceClient;
import com.hrsaas.tenant.client.OrganizationServiceClient;
import com.hrsaas.tenant.client.dto.ApprovalStatisticsDto;
import com.hrsaas.tenant.client.dto.EmployeeSummaryDto;
import com.hrsaas.tenant.client.dto.OrgSummaryDto;
import com.hrsaas.tenant.client.dto.TenantAttendanceSummaryDto;
import com.hrsaas.tenant.domain.dto.response.DashboardOrgSummaryResponse;
import com.hrsaas.tenant.domain.dto.response.DashboardStatisticsResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDashboardService {

    private final Optional<EmployeeServiceClient> employeeServiceClient;
    private final Optional<OrganizationServiceClient> organizationServiceClient;
    private final Optional<AttendanceServiceClient> attendanceServiceClient;
    private final Optional<ApprovalServiceClient> approvalServiceClient;

    @CircuitBreaker(name = "dashboardOrgSummary", fallbackMethod = "orgSummaryFallback")
    public DashboardOrgSummaryResponse getOrgSummary() {
        EmployeeSummaryDto employeeSummary = fetchEmployeeSummary();
        OrgSummaryDto orgSummary = fetchOrgSummary();
        TenantAttendanceSummaryDto attendanceSummary = fetchTenantSummary();

        return DashboardOrgSummaryResponse.builder()
            .totalEmployees(employeeSummary.getTotalEmployees())
            .activeEmployees(employeeSummary.getActiveEmployees())
            .onLeaveEmployees(attendanceSummary.getOnLeaveToday())
            .departmentCount(orgSummary.getDepartmentCount())
            .positionCount(orgSummary.getPositionCount())
            .newHiresThisMonth(employeeSummary.getNewHiresThisMonth())
            .resignedThisMonth(employeeSummary.getResignedThisMonth())
            .build();
    }

    @CircuitBreaker(name = "dashboardStatistics", fallbackMethod = "statisticsFallback")
    public DashboardStatisticsResponse getStatistics() {
        TenantAttendanceSummaryDto attendanceSummary = fetchTenantSummary();
        ApprovalStatisticsDto approvalStats = fetchApprovalStatistics();

        List<DashboardStatisticsResponse.StatisticItem> items = new ArrayList<>();

        items.add(DashboardStatisticsResponse.StatisticItem.builder()
            .label("출근율")
            .value(attendanceSummary.getAttendanceRate())
            .previousValue(attendanceSummary.getPreviousAttendanceRate())
            .format("percent")
            .build());

        items.add(DashboardStatisticsResponse.StatisticItem.builder()
            .label("휴가 사용률")
            .value(attendanceSummary.getLeaveUsageRate())
            .previousValue(attendanceSummary.getPreviousLeaveUsageRate())
            .format("percent")
            .build());

        items.add(DashboardStatisticsResponse.StatisticItem.builder()
            .label("평균 초과근무")
            .value(attendanceSummary.getAvgOvertimeHours())
            .previousValue(attendanceSummary.getPreviousAvgOvertimeHours())
            .format("hours")
            .build());

        items.add(DashboardStatisticsResponse.StatisticItem.builder()
            .label("결재 처리 시간")
            .value(approvalStats.getAvgProcessingTimeHours())
            .previousValue(approvalStats.getPreviousAvgProcessingTimeHours())
            .format("hours")
            .build());

        return DashboardStatisticsResponse.builder().items(items).build();
    }

    public Map<String, Object> getWidgets() {
        List<Map<String, Object>> widgets = List.of(
            widgetConfig("attendance", 1, true),
            widgetConfig("leave-balance", 2, true),
            widgetConfig("team-leave", 3, true),
            widgetConfig("pending-approvals", 4, true),
            widgetConfig("announcements", 5, true),
            widgetConfig("birthdays", 6, true),
            widgetConfig("org-summary", 7, true),
            widgetConfig("statistics", 8, true)
        );
        return Map.of("widgets", widgets);
    }

    private Map<String, Object> widgetConfig(String id, int order, boolean visible) {
        Map<String, Object> widget = new LinkedHashMap<>();
        widget.put("id", id);
        widget.put("order", order);
        widget.put("visible", visible);
        return widget;
    }

    // ===== Feign helper methods =====

    private EmployeeSummaryDto fetchEmployeeSummary() {
        if (employeeServiceClient.isEmpty()) return new EmployeeSummaryDto();
        try {
            var response = employeeServiceClient.get().getEmployeeSummary();
            return response != null && response.getData() != null ? response.getData() : new EmployeeSummaryDto();
        } catch (Exception e) {
            log.warn("Failed to fetch employee summary: {}", e.getMessage());
            return new EmployeeSummaryDto();
        }
    }

    private OrgSummaryDto fetchOrgSummary() {
        if (organizationServiceClient.isEmpty()) return new OrgSummaryDto();
        try {
            var response = organizationServiceClient.get().getOrgSummary();
            return response != null && response.getData() != null ? response.getData() : new OrgSummaryDto();
        } catch (Exception e) {
            log.warn("Failed to fetch org summary: {}", e.getMessage());
            return new OrgSummaryDto();
        }
    }

    private TenantAttendanceSummaryDto fetchTenantSummary() {
        if (attendanceServiceClient.isEmpty()) return new TenantAttendanceSummaryDto();
        try {
            var response = attendanceServiceClient.get().getTenantSummary();
            return response != null && response.getData() != null ? response.getData() : new TenantAttendanceSummaryDto();
        } catch (Exception e) {
            log.warn("Failed to fetch tenant attendance summary: {}", e.getMessage());
            return new TenantAttendanceSummaryDto();
        }
    }

    private ApprovalStatisticsDto fetchApprovalStatistics() {
        if (approvalServiceClient.isEmpty()) return new ApprovalStatisticsDto();
        try {
            var response = approvalServiceClient.get().getStatistics();
            return response != null && response.getData() != null ? response.getData() : new ApprovalStatisticsDto();
        } catch (Exception e) {
            log.warn("Failed to fetch approval statistics: {}", e.getMessage());
            return new ApprovalStatisticsDto();
        }
    }

    // ===== Fallback methods =====

    private DashboardOrgSummaryResponse orgSummaryFallback(Throwable t) {
        log.warn("Org summary circuit breaker fallback: {}", t.getMessage());
        return DashboardOrgSummaryResponse.builder().build();
    }

    private DashboardStatisticsResponse statisticsFallback(Throwable t) {
        log.warn("Statistics circuit breaker fallback: {}", t.getMessage());
        return DashboardStatisticsResponse.builder().items(List.of()).build();
    }
}
