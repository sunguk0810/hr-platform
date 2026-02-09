package com.hrsaas.attendance.scheduler;

import com.hrsaas.attendance.client.EmployeeServiceClient;
import com.hrsaas.attendance.client.TenantServiceClient;
import com.hrsaas.attendance.client.dto.EmployeeBasicDto;
import com.hrsaas.attendance.client.dto.TenantBasicDto;
import com.hrsaas.attendance.repository.LeaveAccrualRuleRepository;
import com.hrsaas.attendance.service.LeaveAccrualService;
import com.hrsaas.attendance.service.LeaveCarryOverService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaveAccrualScheduler {

    private final LeaveAccrualService accrualService;
    private final LeaveCarryOverService carryOverService;
    private final TenantServiceClient tenantServiceClient;
    private final EmployeeServiceClient employeeServiceClient;
    private final LeaveAccrualRuleRepository ruleRepository;

    /**
     * 매년 1월 1일 00:10 - 연간 연차 일괄 생성 + 이월 처리
     */
    @Scheduled(cron = "0 10 0 1 1 *")
    public void generateYearlyLeave() {
        int year = LocalDate.now().getYear();
        log.info("Starting yearly leave accrual generation for year {}", year);

        List<TenantBasicDto> tenants = getActiveTenants();
        int totalGenerated = 0;

        for (TenantBasicDto tenant : tenants) {
            try {
                TenantContext.setCurrentTenant(tenant.getId());

                // 이월 처리
                int carriedOver = carryOverService.processCarryOver(tenant.getId(), year - 1);
                log.info("Carry-over processed for tenant={}: count={}", tenant.getId(), carriedOver);

                // 활성 직원 목록 조회
                List<EmployeeBasicDto> employees = getActiveEmployees();
                List<LeaveAccrualService.EmployeeLeaveInfo> employeeInfos = employees.stream()
                    .map(e -> LeaveAccrualService.EmployeeLeaveInfo.builder()
                        .employeeId(e.getId())
                        .hireDate(e.getHireDate())
                        .gender(e.getGender())
                        .build())
                    .collect(Collectors.toList());

                int count = accrualService.generateAnnualLeave(tenant.getId(), year, employeeInfos);
                totalGenerated += count;
                log.info("Generated {} leave balances for tenant={}", count, tenant.getId());
            } catch (Exception e) {
                log.error("Failed to generate yearly leave for tenant={}: {}", tenant.getId(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }

        log.info("Yearly leave accrual generation completed: total={}", totalGenerated);
    }

    /**
     * 매월 1일 00:20 - 월별 발생 처리
     */
    @Scheduled(cron = "0 20 0 1 * *")
    public void generateMonthlyLeave() {
        int year = LocalDate.now().getYear();
        int month = LocalDate.now().getMonthValue();
        log.info("Starting monthly leave accrual for {}-{}", year, month);

        List<TenantBasicDto> tenants = getActiveTenants();

        for (TenantBasicDto tenant : tenants) {
            try {
                TenantContext.setCurrentTenant(tenant.getId());

                // MONTHLY 타입 규칙 조회
                var monthlyRules = ruleRepository.findActiveByTenantIdAndAccrualType(tenant.getId(), "MONTHLY");
                if (monthlyRules.isEmpty()) {
                    log.debug("No monthly accrual rules for tenant={}", tenant.getId());
                    continue;
                }

                List<EmployeeBasicDto> employees = getActiveEmployees();
                for (EmployeeBasicDto emp : employees) {
                    try {
                        accrualService.generateForEmployee(emp.getId(), emp.getHireDate(), year);
                    } catch (Exception e) {
                        log.warn("Failed monthly accrual for employee={}: {}", emp.getId(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.error("Failed monthly leave for tenant={}: {}", tenant.getId(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }

        log.info("Monthly leave accrual completed");
    }

    /**
     * 매일 01:00 - 입사일 기준 발생 체크
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void checkHireDateBasedAccrual() {
        LocalDate today = LocalDate.now();
        log.info("Starting hire-date based accrual check for {}", today);

        List<TenantBasicDto> tenants = getActiveTenants();

        for (TenantBasicDto tenant : tenants) {
            try {
                TenantContext.setCurrentTenant(tenant.getId());

                var hireDateRules = ruleRepository.findActiveByTenantIdAndAccrualType(tenant.getId(), "HIRE_DATE_BASED");
                if (hireDateRules.isEmpty()) {
                    continue;
                }

                List<EmployeeBasicDto> employees = getActiveEmployees();
                for (EmployeeBasicDto emp : employees) {
                    if (emp.getHireDate() != null && isHireAnniversary(emp.getHireDate(), today)) {
                        try {
                            accrualService.generateForEmployee(emp.getId(), emp.getHireDate(), today.getYear());
                            log.info("Hire anniversary accrual generated: employeeId={}, hireDate={}", emp.getId(), emp.getHireDate());
                        } catch (Exception e) {
                            log.warn("Failed hire-date accrual for employee={}: {}", emp.getId(), e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed hire-date check for tenant={}: {}", tenant.getId(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }

        log.info("Hire-date based accrual check completed");
    }

    private boolean isHireAnniversary(LocalDate hireDate, LocalDate today) {
        return hireDate.getMonthValue() == today.getMonthValue()
            && hireDate.getDayOfMonth() == today.getDayOfMonth()
            && hireDate.getYear() < today.getYear();
    }

    private List<TenantBasicDto> getActiveTenants() {
        try {
            ApiResponse<PageResponse<TenantBasicDto>> response = tenantServiceClient.getAllTenants();
            if (response != null && response.getData() != null) {
                return response.getData().getContent().stream()
                    .filter(t -> "ACTIVE".equals(t.getStatus()))
                    .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Failed to fetch tenants: {}", e.getMessage(), e);
        }
        return Collections.emptyList();
    }

    private List<EmployeeBasicDto> getActiveEmployees() {
        try {
            ApiResponse<List<EmployeeBasicDto>> response = employeeServiceClient.getActiveEmployees("ACTIVE");
            if (response != null && response.getData() != null) {
                return response.getData();
            }
        } catch (Exception e) {
            log.error("Failed to fetch active employees: {}", e.getMessage(), e);
        }
        return Collections.emptyList();
    }
}
