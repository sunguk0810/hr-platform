package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CheckInRequest;
import com.hrsaas.attendance.domain.dto.request.CheckOutRequest;
import com.hrsaas.attendance.domain.dto.response.AttendanceRecordResponse;
import com.hrsaas.attendance.domain.dto.response.AttendanceSummaryResponse;
import com.hrsaas.attendance.service.AttendanceService;
import com.hrsaas.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendances")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * 출근 처리
     */
    @PostMapping("/check-in")
    public ApiResponse<AttendanceRecordResponse> checkIn(
            @Valid @RequestBody CheckInRequest request,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(attendanceService.checkIn(request, userId));
    }

    /**
     * 퇴근 처리
     */
    @PostMapping("/check-out")
    public ApiResponse<AttendanceRecordResponse> checkOut(
            @Valid @RequestBody CheckOutRequest request,
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(attendanceService.checkOut(request, userId));
    }

    /**
     * 오늘 근태 조회
     */
    @GetMapping("/today")
    public ApiResponse<AttendanceRecordResponse> getToday(
            @RequestHeader("X-User-ID") UUID userId) {
        return ApiResponse.success(attendanceService.getToday(userId));
    }

    /**
     * 내 근태 목록 (기간별)
     */
    @GetMapping("/my")
    public ApiResponse<List<AttendanceRecordResponse>> getMyAttendances(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(attendanceService.getMyAttendances(userId, startDate, endDate));
    }

    /**
     * 월별 근태 요약
     */
    @GetMapping("/my/summary")
    public ApiResponse<AttendanceSummaryResponse> getMonthlySummary(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.success(attendanceService.getMonthlySummary(userId, year, month));
    }

    /**
     * 특정 근태 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<AttendanceRecordResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(attendanceService.getById(id));
    }
}
