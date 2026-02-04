package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.dto.response.AttendanceSummaryResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    AttendanceRecordResponse checkIn(CheckInRequest request, UUID employeeId);

    AttendanceRecordResponse checkOut(CheckOutRequest request, UUID employeeId);

    AttendanceRecordResponse getToday(UUID employeeId);

    List<AttendanceRecordResponse> getMyAttendances(UUID employeeId, LocalDate startDate, LocalDate endDate);

    AttendanceSummaryResponse getMonthlySummary(UUID employeeId, int year, int month);

    AttendanceRecordResponse getById(UUID id);
}
