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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HolidayImportScheduler Tests")
class HolidayImportSchedulerTest {

    @Mock
    private HolidayRepository holidayRepository;

    @Mock
    private TenantServiceClient tenantServiceClient;

    @InjectMocks
    private HolidayImportScheduler scheduler;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private TenantBasicDto activeTenant(UUID id) {
        return TenantBasicDto.builder().id(id).code("TEST").name("Test").status("ACTIVE").build();
    }

    @Test
    @DisplayName("importHolidaysForYear: duplicates skipped")
    void importHolidaysForYear_duplicatesSkipped() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
            .content(List.of(activeTenant(tenantId))).build();
        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        // All holidays already exist
        int year = 2026;
        List<Holiday> existingHolidays = KoreanHolidayProvider.getHolidays(year).stream()
            .map(info -> Holiday.builder()
                .holidayDate(info.getDate())
                .name(info.getName())
                .nameEn(info.getNameEn())
                .holidayType(HolidayType.PUBLIC)
                .isPaid(true)
                .build())
            .collect(Collectors.toList());

        when(holidayRepository.findByYear(eq(tenantId), eq(year))).thenReturn(existingHolidays);

        // when
        scheduler.importHolidaysForYear(year);

        // then - no saves since all exist
        verify(holidayRepository, never()).save(any(Holiday.class));
    }

    @Test
    @DisplayName("importHolidaysForYear: multi-tenant processes all")
    void importHolidaysForYear_multiTenant_processesAll() {
        // given
        UUID tenant1 = UUID.randomUUID();
        UUID tenant2 = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
            .content(List.of(activeTenant(tenant1), activeTenant(tenant2))).build();
        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        // No holidays exist yet
        when(holidayRepository.findByYear(any(), anyInt())).thenReturn(Collections.emptyList());
        when(holidayRepository.save(any(Holiday.class))).thenAnswer(inv -> inv.getArgument(0));

        // when
        scheduler.importHolidaysForYear(2026);

        // then - saves for both tenants
        // Each tenant gets the same set of holidays
        verify(holidayRepository, atLeast(2)).save(any(Holiday.class));
    }

    @Test
    @DisplayName("importHolidaysForYear: new holidays are saved")
    void importHolidaysForYear_newHolidays_areSaved() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
            .content(List.of(activeTenant(tenantId))).build();
        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        // No holidays exist
        when(holidayRepository.findByYear(eq(tenantId), anyInt())).thenReturn(Collections.emptyList());
        when(holidayRepository.save(any(Holiday.class))).thenAnswer(inv -> inv.getArgument(0));

        // when
        scheduler.importHolidaysForYear(2026);

        // then - holidays are saved (at least 8 fixed + lunar + substitutes)
        verify(holidayRepository, atLeast(8)).save(any(Holiday.class));
    }
}
