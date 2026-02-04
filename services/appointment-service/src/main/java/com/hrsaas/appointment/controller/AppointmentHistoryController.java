package com.hrsaas.appointment.controller;

import com.hrsaas.appointment.domain.dto.response.AppointmentHistoryResponse;
import com.hrsaas.appointment.domain.dto.response.AppointmentStatisticsResponse;
import com.hrsaas.appointment.domain.entity.AppointmentType;
import com.hrsaas.appointment.service.AppointmentHistoryService;
import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment History", description = "발령 이력 API")
public class AppointmentHistoryController {

    private final AppointmentHistoryService historyService;

    @GetMapping("/history/employee/{employeeId}")
    @Operation(summary = "사원별 발령 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AppointmentHistoryResponse>>> getByEmployeeId(
            @PathVariable UUID employeeId) {
        List<AppointmentHistoryResponse> response = historyService.getByEmployeeId(employeeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history/employee/{employeeId}/paged")
    @Operation(summary = "사원별 발령 이력 페이징 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<AppointmentHistoryResponse>>> getByEmployeeIdPaged(
            @PathVariable UUID employeeId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AppointmentHistoryResponse> page = historyService.getByEmployeeId(employeeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/history/employee/{employeeId}/type/{type}")
    @Operation(summary = "사원별 발령 유형별 이력 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AppointmentHistoryResponse>>> getByEmployeeIdAndType(
            @PathVariable UUID employeeId,
            @PathVariable AppointmentType type) {
        List<AppointmentHistoryResponse> response = historyService.getByEmployeeIdAndType(employeeId, type);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    @Operation(summary = "기간별 발령 이력 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentHistoryResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AppointmentHistoryResponse> response = historyService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/statistics")
    @Operation(summary = "발령 통계 조회")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentStatisticsResponse>> getStatistics(
            @RequestParam Integer year,
            @RequestParam(required = false) Integer month) {
        AppointmentStatisticsResponse response = historyService.getStatistics(year, month);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
