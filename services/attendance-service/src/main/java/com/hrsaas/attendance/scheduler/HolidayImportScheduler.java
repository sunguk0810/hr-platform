package com.hrsaas.attendance.scheduler;

import com.hrsaas.attendance.client.TenantServiceClient;
import com.hrsaas.attendance.client.dto.TenantBasicDto;
import com.hrsaas.attendance.domain.entity.Holiday;
import com.hrsaas.attendance.domain.entity.HolidayType;
import com.hrsaas.attendance.repository.HolidayRepository;
import com.hrsaas.attendance.service.KoreanHolidayProvider;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Scheduler that automatically imports Korean public holidays for the next year.
 * Runs annually on December 1st at 02:00 to pre-populate holidays for all active tenants.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HolidayImportScheduler {

    private final HolidayRepository holidayRepository;
    private final TenantServiceClient tenantServiceClient;

    /**
     * 매년 12월 1일 02:00 - 다음 해 대한민국 공휴일 자동 등록
     */
    @Scheduled(cron = "0 0 2 1 12 *")
    public void importNextYearHolidays() {
        int nextYear = LocalDate.now().getYear() + 1;
        log.info("Starting Korean holiday import for year {}", nextYear);
        importHolidaysForYear(nextYear);
    }

    /**
     * Import holidays for a specific year across all tenants.
     * Can be called programmatically for manual import or re-import.
     *
     * @param year the year to import holidays for
     */
    public void importHolidaysForYear(int year) {
        List<KoreanHolidayProvider.HolidayInfo> holidays = KoreanHolidayProvider.getHolidays(year);
        if (holidays.isEmpty()) {
            log.warn("No holidays defined for year {}", year);
            return;
        }

        List<TenantBasicDto> tenants = getActiveTenants();
        int totalImported = 0;

        for (TenantBasicDto tenant : tenants) {
            try {
                TenantContext.setCurrentTenant(tenant.getId());
                int imported = importHolidaysForTenant(tenant.getId(), year, holidays);
                totalImported += imported;
                log.info("Imported {} holidays for tenant={}, year={}", imported, tenant.getId(), year);
            } catch (Exception e) {
                log.error("Failed to import holidays for tenant={}: {}", tenant.getId(), e.getMessage(), e);
            } finally {
                TenantContext.clear();
            }
        }

        log.info("Korean holiday import completed: year={}, totalImported={}", year, totalImported);
    }

    private int importHolidaysForTenant(UUID tenantId, int year, List<KoreanHolidayProvider.HolidayInfo> holidays) {
        int importedCount = 0;

        // Fetch existing holidays for the year to avoid N+1 queries
        Set<LocalDate> existingDates = holidayRepository.findByYear(tenantId, year).stream()
            .map(Holiday::getHolidayDate)
            .collect(Collectors.toSet());

        for (KoreanHolidayProvider.HolidayInfo info : holidays) {
            // Skip if already exists
            if (existingDates.contains(info.getDate())) {
                log.debug("Holiday already exists: tenant={}, date={}, name={}", tenantId, info.getDate(), info.getName());
                continue;
            }

            HolidayType type = info.isNational() ? HolidayType.NATIONAL : HolidayType.PUBLIC;
            if (info.getName().contains("대체공휴일")) {
                type = HolidayType.SUBSTITUTE;
            }

            Holiday holiday = Holiday.builder()
                .holidayDate(info.getDate())
                .name(info.getName())
                .nameEn(info.getNameEn())
                .holidayType(type)
                .isPaid(true)
                .build();

            holidayRepository.save(holiday);
            importedCount++;
        }

        return importedCount;
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
}
