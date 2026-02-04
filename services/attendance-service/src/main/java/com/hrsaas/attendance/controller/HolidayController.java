package com.hrsaas.attendance.controller;

import com.hrsaas.attendance.domain.dto.request.CreateHolidayRequest;
import com.hrsaas.attendance.domain.dto.response.HolidayResponse;
import com.hrsaas.attendance.domain.entity.HolidayType;
import com.hrsaas.attendance.service.HolidayService;
import com.hrsaas.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/holidays")
@RequiredArgsConstructor
@Tag(name = "Holiday", description = "공휴일 관리 API")
public class HolidayController {

    private final HolidayService holidayService;

    @PostMapping
    @Operation(summary = "공휴일 등록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<HolidayResponse>> create(
            @Valid @RequestBody CreateHolidayRequest request) {
        HolidayResponse response = holidayService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @PostMapping("/batch")
    @Operation(summary = "공휴일 일괄 등록")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> createBatch(
            @Valid @RequestBody List<CreateHolidayRequest> requests) {
        List<HolidayResponse> response = holidayService.createBatch(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "공휴일 상세 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<HolidayResponse>> getById(@PathVariable UUID id) {
        HolidayResponse response = holidayService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "공휴일 목록 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> getHolidays(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) HolidayType holidayType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<HolidayResponse> response;

        if (startDate != null && endDate != null) {
            response = holidayService.getByDateRange(startDate, endDate);
        } else if (year != null && holidayType != null) {
            response = holidayService.getByYearAndType(year, holidayType);
        } else {
            int targetYear = year != null ? year : LocalDate.now().getYear();
            response = holidayService.getByYear(targetYear);
        }

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/check")
    @Operation(summary = "특정 날짜 휴일 여부 확인")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> isHoliday(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        boolean isHoliday = holidayService.isHoliday(date);
        return ResponseEntity.ok(ApiResponse.success(isHoliday));
    }

    @GetMapping("/count")
    @Operation(summary = "기간 내 휴일 수 조회")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Long>> countHolidays(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        long count = holidayService.countHolidaysInRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "공휴일 삭제")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        holidayService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "공휴일이 삭제되었습니다."));
    }
}
