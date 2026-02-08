package com.hrsaas.tenant.service;

import com.hrsaas.tenant.client.ApprovalServiceClient;
import com.hrsaas.tenant.client.AttendanceServiceClient;
import com.hrsaas.tenant.client.EmployeeServiceClient;
import com.hrsaas.tenant.domain.entity.Tenant;
import com.hrsaas.tenant.domain.entity.TenantStatus;
import com.hrsaas.tenant.repository.TenantRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupDashboardService {

    private final TenantRepository tenantRepository;
    private final Optional<EmployeeServiceClient> employeeServiceClient;
    private final Optional<ApprovalServiceClient> approvalServiceClient;
    private final Optional<AttendanceServiceClient> attendanceServiceClient;

    public Map<String, Object> getGroupDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        List<Tenant> allTenants = tenantRepository.findAll();
        List<Tenant> activeTenants = allTenants.stream()
            .filter(t -> t.getStatus() == TenantStatus.ACTIVE)
            .toList();

        dashboard.put("totalTenants", allTenants.size());
        dashboard.put("activeTenants", activeTenants.size());
        dashboard.put("suspendedTenants", allTenants.stream()
            .filter(t -> t.getStatus() == TenantStatus.SUSPENDED).count());

        // Aggregate from services (with circuit breaker)
        dashboard.put("totalEmployees", getTotalEmployeeCount(activeTenants));
        dashboard.put("activeApprovals", getTotalPendingApprovals(activeTenants));
        dashboard.put("pendingLeaveRequests", getTotalPendingLeaves(activeTenants));

        // Expiring tenants (within 30 days)
        LocalDate thirtyDaysLater = LocalDate.now().plusDays(30);
        List<Map<String, Object>> expiringTenants = tenantRepository
            .findByContractEndDateBetween(LocalDate.now(), thirtyDaysLater)
            .stream()
            .map(t -> {
                Map<String, Object> info = new HashMap<>();
                info.put("tenantId", t.getId());
                info.put("tenantCode", t.getCode());
                info.put("tenantName", t.getName());
                info.put("contractEndDate", t.getContractEndDate());
                return info;
            })
            .collect(Collectors.toList());
        dashboard.put("expiringTenants", expiringTenants);

        log.info("Group dashboard requested");
        return dashboard;
    }

    @CircuitBreaker(name = "employeeService", fallbackMethod = "employeeCountFallback")
    private long getTotalEmployeeCount(List<Tenant> tenants) {
        if (employeeServiceClient.isEmpty()) return 0;
        long total = 0;
        for (Tenant tenant : tenants) {
            try {
                var response = employeeServiceClient.get().getEmployeeCount(tenant.getId().toString());
                if (response != null && response.getData() != null) {
                    total += response.getData();
                }
            } catch (Exception e) {
                log.debug("Failed to get employee count for tenant {}: {}", tenant.getId(), e.getMessage());
            }
        }
        return total;
    }

    @CircuitBreaker(name = "approvalService", fallbackMethod = "approvalCountFallback")
    private long getTotalPendingApprovals(List<Tenant> tenants) {
        if (approvalServiceClient.isEmpty()) return 0;
        long total = 0;
        for (Tenant tenant : tenants) {
            try {
                var response = approvalServiceClient.get().getPendingApprovalCount(tenant.getId().toString());
                if (response != null && response.getData() != null) {
                    total += response.getData();
                }
            } catch (Exception e) {
                log.debug("Failed to get approval count for tenant {}: {}", tenant.getId(), e.getMessage());
            }
        }
        return total;
    }

    @CircuitBreaker(name = "attendanceService", fallbackMethod = "leaveCountFallback")
    private long getTotalPendingLeaves(List<Tenant> tenants) {
        if (attendanceServiceClient.isEmpty()) return 0;
        long total = 0;
        for (Tenant tenant : tenants) {
            try {
                var response = attendanceServiceClient.get().getPendingLeaveCount(tenant.getId().toString());
                if (response != null && response.getData() != null) {
                    total += response.getData();
                }
            } catch (Exception e) {
                log.debug("Failed to get leave count for tenant {}: {}", tenant.getId(), e.getMessage());
            }
        }
        return total;
    }

    private long employeeCountFallback(List<Tenant> tenants, Throwable t) {
        log.warn("Employee service unavailable: {}", t.getMessage());
        return 0;
    }

    private long approvalCountFallback(List<Tenant> tenants, Throwable t) {
        log.warn("Approval service unavailable: {}", t.getMessage());
        return 0;
    }

    private long leaveCountFallback(List<Tenant> tenants, Throwable t) {
        log.warn("Attendance service unavailable: {}", t.getMessage());
        return 0;
    }
}
