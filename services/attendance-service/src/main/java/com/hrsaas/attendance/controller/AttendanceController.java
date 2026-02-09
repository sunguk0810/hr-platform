package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.request.UpdateAttendanceRecordRequest;
import com.hrsaas.attendance.domain.dto.response.*;
import com.hrsaas.attendance.service.AttendanceService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendances")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "근태 관리 API")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @Operation(summary = "출근 처리")
    @PostMapping("/check-in")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceRecordResponse> checkIn(
            @Valid @RequestBody CheckInRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(attendanceService.checkIn(request, userId));
    }

    @Operation(summary = "퇴근 처리")
    @PostMapping("/check-out")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceRecordResponse> checkOut(
            @Valid @RequestBody CheckOutRequest request) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(attendanceService.checkOut(request, userId));
    }

    @Operation(summary = "오늘 근태 조회")
    @GetMapping("/today")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceRecordResponse> getToday() {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(attendanceService.getToday(userId));
    }

    @Operation(summary = "내 근태 목록 조회")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<AttendanceRecordResponse>> getMyAttendances(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(attendanceService.getMyAttendances(userId, startDate, endDate));
    }

    @Operation(summary = "월별 근태 요약")
    @GetMapping("/my/summary")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AttendanceSummaryResponse> getMonthlySummary(
            @RequestParam int year,
            @RequestParam int month) {
        UUID userId = SecurityContextHolder.getCurrentUser().getUserId();
        return ApiResponse.success(attendanceService.getMonthlySummary(userId, year, month));
    }

    @Operation(summary = "특정 근태 조회")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<AttendanceRecordResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(attendanceService.getById(id));
    }

    @Operation(summary = "관리자 근태 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<AttendanceRecordResponse> updateRecord(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAttendanceRecordRequest request) {
        UserContext user = SecurityContextHolder.getCurrentUser();
        return ApiResponse.success(attendanceService.updateRecord(
                id, request, user.getUserId(), user.getEmployeeName()));
    }

    @Operation(summary = "주간 근로시간 통계 조회 (52시간 모니터링)")
    @GetMapping("/statistics/work-hours")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<WorkHoursStatisticsResponse> getWorkHoursStatistics(
            @RequestParam(required = false) String weekPeriod,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(attendanceService.getWorkHoursStatistics(weekPeriod, departmentId, status));
    }

    @Operation(summary = "부서별 근태 현황")
    @GetMapping("/department/{departmentId}/summary")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<DepartmentAttendanceSummaryResponse> getDepartmentSummary(
            @PathVariable UUID departmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(attendanceService.getDepartmentSummary(departmentId, date));
    }

    @Operation(summary = "테넌트 근태 통계 (대시보드용)")
    @GetMapping("/tenant-summary")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<TenantAttendanceSummaryResponse> getTenantSummary() {
        return ApiResponse.success(attendanceService.getTenantSummary());
    }
}
