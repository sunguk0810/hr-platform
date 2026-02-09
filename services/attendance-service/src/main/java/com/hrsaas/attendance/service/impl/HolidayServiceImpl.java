package com.hrsaas.attendance.service.impl;

import com.hrsaas.attendance.domain.dto.request.CreateHolidayRequest;
import com.hrsaas.attendance.domain.dto.response.HolidayResponse;
import com.hrsaas.attendance.domain.entity.Holiday;
import com.hrsaas.attendance.domain.entity.HolidayType;
import com.hrsaas.attendance.repository.HolidayRepository;
import com.hrsaas.attendance.service.HolidayService;
import com.hrsaas.attendance.domain.AttendanceErrorCode;
import com.hrsaas.common.core.exception.DuplicateException;
import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    @Override
    @Transactional
    @CacheEvict(value = "holiday", allEntries = true)
    public HolidayResponse create(CreateHolidayRequest request) {
        UUID tenantId = TenantContext.getCurrentTenant();

        if (holidayRepository.existsByTenantIdAndHolidayDate(tenantId, request.getHolidayDate())) {
            throw new DuplicateException(AttendanceErrorCode.HOLIDAY_DUPLICATE, "이미 등록된 휴일입니다: " + request.getHolidayDate());
        }

        Holiday holiday = Holiday.builder()
            .holidayDate(request.getHolidayDate())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .holidayType(request.getHolidayType())
            .isPaid(request.getIsPaid())
            .description(request.getDescription())
            .build();

        Holiday saved = holidayRepository.save(holiday);
        log.info("Holiday created: id={}, date={}", saved.getId(), saved.getHolidayDate());

        return HolidayResponse.from(saved);
    }

    @Override
    public HolidayResponse getById(UUID id) {
        Holiday holiday = findById(id);
        return HolidayResponse.from(holiday);
    }

    @Override
    @Cacheable(value = "holiday", key = "'year-' + #year", unless = "#result == null || #result.isEmpty()")
    public List<HolidayResponse> getByYear(Integer year) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Holiday> holidays = holidayRepository.findByYear(tenantId, year);

        return holidays.stream()
            .map(HolidayResponse::from)
            .collect(Collectors.toList());
    }

    @Override
    public List<HolidayResponse> getByYearAndType(Integer year, HolidayType holidayType) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Holiday> holidays = holidayRepository.findByYearAndType(tenantId, year, holidayType);

        return holidays.stream()
            .map(HolidayResponse::from)
            .toList();
    }

    @Override
    public List<HolidayResponse> getByDateRange(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Holiday> holidays = holidayRepository.findByDateRange(tenantId, startDate, endDate);

        return holidays.stream()
            .map(HolidayResponse::from)
            .toList();
    }

    @Override
    public boolean isHoliday(LocalDate date) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return holidayRepository.findByDate(tenantId, date).isPresent();
    }

    @Override
    public long countHolidaysInRange(LocalDate startDate, LocalDate endDate) {
        UUID tenantId = TenantContext.getCurrentTenant();
        return holidayRepository.countByDateRange(tenantId, startDate, endDate);
    }

    @Override
    @Transactional
    @CacheEvict(value = "holiday", allEntries = true)
    public void delete(UUID id) {
        Holiday holiday = findById(id);
        holidayRepository.delete(holiday);
        log.info("Holiday deleted: id={}, date={}", id, holiday.getHolidayDate());
    }

    @Override
    @Transactional
    @CacheEvict(value = "holiday", allEntries = true)
    public List<HolidayResponse> createBatch(List<CreateHolidayRequest> requests) {
        UUID tenantId = TenantContext.getCurrentTenant();
        List<Holiday> holidays = new ArrayList<>();

        for (CreateHolidayRequest request : requests) {
            if (!holidayRepository.existsByTenantIdAndHolidayDate(tenantId, request.getHolidayDate())) {
                Holiday holiday = Holiday.builder()
                    .holidayDate(request.getHolidayDate())
                    .name(request.getName())
                    .nameEn(request.getNameEn())
                    .holidayType(request.getHolidayType())
                    .isPaid(request.getIsPaid())
                    .description(request.getDescription())
                    .build();
                holidays.add(holiday);
            }
        }

        List<Holiday> saved = holidayRepository.saveAll(holidays);
        log.info("Holidays batch created: count={}", saved.size());

        return saved.stream()
            .map(HolidayResponse::from)
            .toList();
    }

    private Holiday findById(UUID id) {
        return holidayRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(AttendanceErrorCode.HOLIDAY_NOT_FOUND, "휴일을 찾을 수 없습니다: " + id));
    }
}
