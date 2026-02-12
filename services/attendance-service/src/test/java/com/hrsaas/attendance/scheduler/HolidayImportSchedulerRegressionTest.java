package com.hrsaas.attendance.scheduler;

import com.hrsaas.attendance.client.TenantServiceClient;
import com.hrsaas.attendance.client.dto.TenantBasicDto;
import com.hrsaas.attendance.domain.entity.Holiday;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HolidayImportScheduler Regression Test")
class HolidayImportSchedulerRegressionTest {

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
    @DisplayName("OPTIMIZED: verify 1 call for findByYear")
    void verifyOptimization_OneQuery() {
        // given
        UUID tenantId = UUID.randomUUID();
        PageResponse<TenantBasicDto> pageResponse = PageResponse.<TenantBasicDto>builder()
            .content(List.of(activeTenant(tenantId))).build();
        when(tenantServiceClient.getAllTenants()).thenReturn(ApiResponse.success(pageResponse));

        int year = 2026;
        List<KoreanHolidayProvider.HolidayInfo> holidays = KoreanHolidayProvider.getHolidays(year);

        // Mock findByYear to return empty list (no holidays exist yet)
        when(holidayRepository.findByYear(eq(tenantId), eq(year))).thenReturn(List.of());

        // when
        scheduler.importHolidaysForYear(year);

        // then
        // Verify findByYear is called exactly once
        verify(holidayRepository, times(1)).findByYear(eq(tenantId), eq(year));

        // And existsByTenantIdAndHolidayDate is NEVER called
        verify(holidayRepository, never()).existsByTenantIdAndHolidayDate(any(), any());
    }
}
