package com.hrsaas.attendance.service;

import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.request.UpdateAttendanceRecordRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.dto.response.AttendanceSummaryResponse;
import com.hrsaas.attendance.domain.dto.response.DepartmentAttendanceSummaryResponse;
import com.hrsaas.attendance.domain.dto.response.WorkHoursStatisticsResponse;

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

    /**
     * 관리자 근태 기록 수정 (감사 로그 포함)
     */
    AttendanceRecordResponse updateRecord(UUID id, UpdateAttendanceRecordRequest request,
                                           UUID adminId, String adminName);

    /**
     * 주간 근로시간 통계 조회 (52시간 모니터링)
     * @param weekPeriod ISO 주간 포맷 (예: "2024-W03")
     * @param departmentId 부서 ID (선택)
     * @param status 상태 필터 (NORMAL, WARNING, EXCEEDED) (선택)
     */
    WorkHoursStatisticsResponse getWorkHoursStatistics(String weekPeriod, UUID departmentId, String status);

    /**
     * 부서별 근태 현황 요약
     * @param departmentId 부서 ID
     * @param date 조회 일자
     * @return 부서 근태 요약 (출근, 지각, 결근, 휴가 인원 등)
     */
    DepartmentAttendanceSummaryResponse getDepartmentSummary(UUID departmentId, LocalDate date);
}
