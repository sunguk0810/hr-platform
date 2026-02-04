package com.hrsaas.appointment.service.impl;

import com.hrsaas.appointment.domain.dto.response.AppointmentHistoryResponse;
import com.hrsaas.appointment.domain.dto.response.AppointmentStatisticsResponse;
import com.hrsaas.appointment.domain.entity.AppointmentHistory;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.appointment.repository.AppointmentHistoryRepository;
import com.hrsaas.appointment.service.AppointmentHistoryService;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentHistoryServiceImpl implements AppointmentHistoryService {

    private final AppointmentHistoryRepository historyRepository;

    @Override
    public List<AppointmentHistoryResponse> getByEmployeeId(UUID employeeId) {
        List<AppointmentHistory> histories = historyRepository.findByEmployeeId(employeeId);
        return histories.stream()
            .map(AppointmentHistoryResponse::from)
            .toList();
    }

    @Override
    public Page<AppointmentHistoryResponse> getByEmployeeId(UUID employeeId, Pageable pageable) {
        Page<AppointmentHistory> page = historyRepository.findByEmployeeId(employeeId, pageable);
        return page.map(AppointmentHistoryResponse::from);
    }

    @Override
    public List<AppointmentHistoryResponse> getByEmployeeIdAndType(UUID employeeId, AppointmentType type) {
        List<AppointmentHistory> histories = historyRepository.findByEmployeeIdAndAppointmentType(employeeId, type);
        return histories.stream()
            .map(AppointmentHistoryResponse::from)
            .toList();
    }

    @Override
    public List<AppointmentHistoryResponse> getByDateRange(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<AppointmentHistory> histories = historyRepository.findByTenantIdAndEffectiveDateBetween(
            tenantId, startDate, endDate);
        return histories.stream()
            .map(AppointmentHistoryResponse::from)
            .toList();
    }

    @Override
    public AppointmentStatisticsResponse getStatistics(Integer year, Integer month) {
        UUID tenantId = TenantContext.getCurrentTenant();

        LocalDate startDate;
        LocalDate endDate;
        String period;

        if (month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1);
            endDate = yearMonth.atEndOfMonth();
            period = String.format("%d-%02d", year, month);
        } else {
            startDate = LocalDate.of(year, 1, 1);
            endDate = LocalDate.of(year, 12, 31);
            period = String.valueOf(year);
        }

        List<Object[]> results = historyRepository.countByTenantIdAndEffectiveDateBetweenGroupByType(
            tenantId, startDate, endDate);

        List<AppointmentStatisticsResponse.TypeCount> typeCounts = new ArrayList<>();
        long total = 0;

        for (Object[] result : results) {
            AppointmentType type = (AppointmentType) result[0];
            long count = (Long) result[1];
            total += count;

            typeCounts.add(AppointmentStatisticsResponse.TypeCount.builder()
                .type(type.name())
                .typeName(getTypeName(type))
                .count(count)
                .build());
        }

        return AppointmentStatisticsResponse.builder()
            .period(period)
            .total(total)
            .byType(typeCounts)
            .build();
    }

    private String getTypeName(AppointmentType type) {
        return switch (type) {
            case PROMOTION -> "승진";
            case TRANSFER -> "전보";
            case POSITION_CHANGE -> "보직변경";
            case JOB_CHANGE -> "직무변경";
            case LEAVE_OF_ABSENCE -> "휴직";
            case REINSTATEMENT -> "복직";
            case RESIGNATION -> "사직";
            case RETIREMENT -> "정년퇴직";
            case DEMOTION -> "강등";
            case CONCURRENT -> "겸직";
        };
    }
}
