package com.hrsaas.appointment.service;

import com.hrsaas.appointment.domain.dto.response.AppointmentHistoryResponse;
import com.hrsaas.appointment.domain.dto.response.AppointmentStatisticsResponse;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AppointmentHistoryService {

    List<AppointmentHistoryResponse> getByEmployeeId(UUID employeeId);

    Page<AppointmentHistoryResponse> getByEmployeeId(UUID employeeId, Pageable pageable);

    List<AppointmentHistoryResponse> getByEmployeeIdAndType(UUID employeeId, AppointmentType type);

    List<AppointmentHistoryResponse> getByDateRange(LocalDate startDate, LocalDate endDate);

    AppointmentStatisticsResponse getStatistics(Integer year, Integer month);
}
