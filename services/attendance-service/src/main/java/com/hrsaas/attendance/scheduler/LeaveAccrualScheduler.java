package com.hrsaas.attendance.scheduler;

import com.hrsaas.attendance.service.LeaveAccrualService;
import com.hrsaas.attendance.service.LeaveCarryOverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaveAccrualScheduler {

    private final LeaveAccrualService accrualService;
    private final LeaveCarryOverService carryOverService;

    /**
     * 매년 1월 1일 00:10 - 연간 연차 일괄 생성 + 이월 처리
     * 실제로는 테넌트 목록을 조회하여 각 테넌트별 처리 필요
     */
    @Scheduled(cron = "0 10 0 1 1 *")
    public void generateYearlyLeave() {
        int year = LocalDate.now().getYear();
        log.info("Starting yearly leave accrual generation for year {}", year);
        // TODO: Iterate over all active tenants
        // For each tenant:
        //   1. Fetch all active employees
        //   2. Call accrualService.generateAnnualLeave(tenantId, year, employees)
        //   3. Call carryOverService.processCarryOver(tenantId, year - 1)
        log.info("Yearly leave accrual generation completed");
    }

    /**
     * 매월 1일 00:20 - 월별 발생 처리
     */
    @Scheduled(cron = "0 20 0 1 * *")
    public void generateMonthlyLeave() {
        log.info("Starting monthly leave accrual");
        // TODO: Process MONTHLY accrual type rules
        log.info("Monthly leave accrual completed");
    }

    /**
     * 매일 01:00 - 입사일 기준 발생 체크
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void checkHireDateBasedAccrual() {
        log.info("Starting hire-date based accrual check");
        // TODO: Check employees with hire date anniversary today
        log.info("Hire-date based accrual check completed");
    }
}
