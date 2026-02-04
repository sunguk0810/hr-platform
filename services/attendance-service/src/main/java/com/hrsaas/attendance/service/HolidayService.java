package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CreateHolidayRequest;
import com.hrsaas.attendance.domain.dto.response.HolidayResponse;
import com.hrsaas.attendance.domain.entity.HolidayType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface HolidayService {

    HolidayResponse create(CreateHolidayRequest request);

    HolidayResponse getById(UUID id);

    List<HolidayResponse> getByYear(Integer year);

    List<HolidayResponse> getByYearAndType(Integer year, HolidayType holidayType);

    List<HolidayResponse> getByDateRange(LocalDate startDate, LocalDate endDate);

    boolean isHoliday(LocalDate date);

    long countHolidaysInRange(LocalDate startDate, LocalDate endDate);

    void delete(UUID id);

    List<HolidayResponse> createBatch(List<CreateHolidayRequest> requests);
}
